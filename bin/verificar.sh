#!/usr/bin/env bash
# Roda as verificações da Definição de Pronto nos arquivos que mudaram desde a base.
# Uso: bash bin/verificar.sh [branch-base]   (padrão: main)
#
# Compatível com o bash 3.2 do macOS: sem mapfile e sem "set -u", que no 3.2
# quebra ao expandir array vazio.
set -o pipefail

BASE="${1:-main}"
cd "$(git rev-parse --show-toplevel)" || exit 2

if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
    echo "Branch base '$BASE' não encontrada." >&2
    exit 2
fi

# Inclui o que já foi commitado na branch, o que ainda não foi e os arquivos novos.
CHANGED=()
while IFS= read -r f; do
    [ -n "$f" ] && CHANGED+=("$f")
done < <(
    {
        git diff --name-only --diff-filter=AMR "$BASE"...HEAD
        git diff --name-only --diff-filter=AMR
        git diff --cached --name-only --diff-filter=AMR
        git ls-files --others --exclude-standard
    } | sort -u
)

PHP_FILES=()
TEST_FILES=()   # testes PHP fora de modules/ (dentro de modules/ roda a suíte do módulo)
MODULES=""      # módulos de modules/ com PHP alterado, separados por espaço
ARCH=0
JS_FILES=()     # resources/ para ESLint e Prettier
FRONT_CHANGED=0
for f in "${CHANGED[@]}"; do
    [ -f "$f" ] || continue
    case "$f" in
        vendor/* | node_modules/* | public/build/*) continue ;;
    esac
    case "$f" in
        *.php)
            PHP_FILES+=("$f")
            case "$f" in
                modules/*)
                    ARCH=1
                    m=$(echo "$f" | cut -d/ -f2)
                    case " $MODULES " in
                        *" $m "*) ;;
                        *) MODULES="$MODULES $m" ;;
                    esac
                    ;;
                app/* | tests/Architecture/*)
                    ARCH=1
                    [ "${f%Test.php}" != "$f" ] && TEST_FILES+=("$f")
                    ;;
                *Test.php) TEST_FILES+=("$f") ;;
            esac
            ;;
    esac
    case "$f" in
        resources/*.ts | resources/*.tsx | resources/*.js | resources/*.jsx)
            JS_FILES+=("$f")
            FRONT_CHANGED=1
            ;;
        resources/js/* | package.json | package-lock.json | tsconfig.json | vite.config.ts | vitest.config.ts | eslint.config.js)
            FRONT_CHANGED=1
            ;;
    esac
done

AGY_HARNESS=0
for f in "${CHANGED[@]}"; do
    case "$f" in
        bin/agy* | tests/bin/agy* | tests/bin/fixtures/*) AGY_HARNESS=1 ;;
    esac
done

if [ "${#PHP_FILES[@]}" -eq 0 ] && [ "$FRONT_CHANGED" -eq 0 ]; then
    if [ "$AGY_HARNESS" -eq 1 ]; then
        HARNESS_FAILED=0
        for t in tests/bin/agy-*_test.sh; do
            [ -f "$t" ] || continue
            echo
            echo "==> $(basename "$t")"
            bash "$t" || HARNESS_FAILED=1
        done
        exit "$HARNESS_FAILED"
    fi
    echo "Nenhum arquivo PHP ou do frontend mudou desde '$BASE'. Nada para verificar."
    exit 0
fi

RESULTS=()
FAILED=0

record() {
    RESULTS+=("$1|$2")
    case "$2" in
        OK* | PULADO*) ;;
        *) FAILED=1 ;;
    esac
}

run_agy_harness_tests() {
    local t
    for t in tests/bin/agy-*_test.sh; do
        [ -f "$t" ] || continue
        echo
        echo "==> $(basename "$t")"
        if bash "$t"; then
            record "Harness $(basename "$t")" "OK"
        else
            record "Harness $(basename "$t")" "FALHOU"
        fi
    done
}

run() {
    local name="$1"
    shift
    echo
    echo "==> $name"
    if "$@"; then
        record "$name" "OK"
    else
        record "$name" "FALHOU"
    fi
}

# O PHPUnit pode terminar sem erro mesmo sem ter rodado nenhum teste.
phpunit() {
    local name="$1"
    shift
    echo
    echo "==> $name"
    local out code
    out=$(vendor/bin/phpunit --colors=never "$@" 2>&1)
    code=$?
    echo "$out"
    if echo "$out" | grep -q "No tests executed"; then
        record "$name" "FALHOU (nenhum teste rodou)"
    elif [ "$code" -ne 0 ]; then
        record "$name" "FALHOU"
    else
        record "$name" "OK"
    fi
}

if [ "${#PHP_FILES[@]}" -gt 0 ]; then
    if [ -x vendor/bin/pint ]; then
        run "Pint" vendor/bin/pint --test "${PHP_FILES[@]}"
    else
        record "Pint" "NÃO VERIFICADO (pint não instalado: rode composer install)"
    fi

    if [ ! -x vendor/bin/phpunit ]; then
        record "PHPUnit" "NÃO VERIFICADO (phpunit não instalado: rode composer install)"
    else
        for m in $MODULES; do
            if [ -n "$(find "modules/$m/tests" -name '*Test.php' 2>/dev/null | head -1)" ]; then
                phpunit "PHPUnit modules/$m" "modules/$m/tests"
            else
                record "PHPUnit modules/$m" "NÃO VERIFICADO (o módulo não tem nenhum teste)"
            fi
        done
        for t in "${TEST_FILES[@]}"; do
            phpunit "PHPUnit $t" "$t"
        done
        if [ "$ARCH" -eq 1 ]; then
            phpunit "PHPUnit Architecture" --testsuite Architecture
        fi
        if [ -z "$MODULES" ] && [ "${#TEST_FILES[@]}" -eq 0 ] && [ "$ARCH" -eq 0 ]; then
            record "PHPUnit" "PULADO (nenhum teste PHP afetado: comportamento novo precisa de teste)"
        fi
    fi
fi

if [ "$FRONT_CHANGED" -eq 1 ]; then
    if [ ! -d node_modules ]; then
        record "Frontend" "NÃO VERIFICADO (rode npm install)"
    else
        # "npm run lint" e "npm run format" corrigem arquivos; aqui só conferimos.
        if [ "${#JS_FILES[@]}" -gt 0 ]; then
            run "ESLint" npx --no-install eslint "${JS_FILES[@]}"
            run "Prettier" npx --no-install prettier --check "${JS_FILES[@]}"
        fi
        run "TypeScript (npm run types)" npm run --silent types
        run "Vitest (npm run test)" npm run --silent test
        run "Build (npm run build)" npm run --silent build
    fi
fi

if [ "$AGY_HARNESS" -eq 1 ]; then
    run_agy_harness_tests || true
fi

echo
echo "Resumo (base: $BASE)"
for r in "${RESULTS[@]}"; do
    printf '  %-45s %s\n' "${r%%|*}" "${r#*|}"
done

exit "$FAILED"
