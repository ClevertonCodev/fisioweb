# Sistema de Módulos Laravel

Este projeto utiliza um sistema de módulos que permite organizar o código em estruturas modulares e reutilizáveis. Cada módulo é uma unidade independente que contém seus próprios controllers, models, migrations, routes, views e outros componentes.

## 📁 Estrutura de um Módulo

Quando você cria um módulo, a seguinte estrutura é gerada:

```
modules/
└── NomeDoModulo/
    ├── Providers/
    │   └── NomeDoModuloServiceProvider.php
    ├── Http/
    │   ├── Controllers/
    │   ├── Middleware/
    │   ├── Requests/
    │   └── Resources/
    ├── Models/
    ├── Repositories/
    ├── Services/
    ├── database/
    │   ├── migrations/
    │   ├── factories/
    │   └── seeders/
    ├── routes/
    │   └── web.php
    ├── resources/
    │   └── views/
    └── tests/
        ├── Feature/
        └── Unit/
```

## 🚀 Comandos Disponíveis

### Criar um Módulo Completo

Cria um módulo completo com toda a estrutura básica (Provider, Controller, Model, Migration, Routes, Views, Factory, Seeder e Tests):

```bash
php artisan modules:make NomeDoModulo
```

**Exemplo:**
```bash
php artisan modules:make Produtos
```

Isso criará:
- Módulo `Produtos` em `modules/Produtos/`
- Service Provider registrado automaticamente
- Controller, Model, Migration, Routes, Views, Factory, Seeder e Tests

### Criar Componentes Dentro de Módulos

Você pode criar componentes individuais dentro de módulos existentes. **Se o módulo não existir, ele será criado automaticamente com a estrutura básica (Provider + diretórios necessários).**

#### Criar Model

```bash
php artisan modules:makeModel {nome-do-modulo} [nome-do-model]
```

**Exemplos:**
```bash
# Cria módulo "Produtos" (se não existir) + Model "Produto"
php artisan modules:makeModel produtos

# Cria Model "User" no módulo "Produtos" (cria módulo se não existir)
php artisan modules:makeModel produtos User

# Cria Model "Category" no módulo existente "Produtos"
php artisan modules:makeModel produtos Category
```

#### Criar Repository

```bash
php artisan modules:makeRepository {nome-do-modulo} [nome-do-repository]
```

**Exemplos:**
```bash
# Cria módulo "Produtos" (se não existir) + Repository "ProdutoRepository"
php artisan modules:makeRepository produtos

# Cria Repository "UserRepository" no módulo "Produtos"
php artisan modules:makeRepository produtos UserRepository

# Cria Repository "ProductRepository" no módulo existente
php artisan modules:makeRepository produtos ProductRepository
```

#### Criar Service

```bash
php artisan modules:makeService {nome-do-modulo} [nome-do-service]
```

**Exemplos:**
```bash
# Cria módulo "Produtos" (se não existir) + Service "ProdutoService"
php artisan modules:makeService produtos

# Cria Service "UserService" no módulo "Produtos"
php artisan modules:makeService produtos UserService

# Cria Service "ProductService" no módulo existente
php artisan modules:makeService produtos ProductService
```

#### Criar Controller

```bash
php artisan modules:makeController {nome-do-modulo} [nome-do-controller]
```

**Exemplos:**
```bash
# Cria módulo "Produtos" (se não existir) + Controller "ProdutoController"
php artisan modules:makeController produtos

# Cria Controller "UserController" no módulo "Produtos"
php artisan modules:makeController produtos UserController

# Cria Controller "ProductController" no módulo existente
php artisan modules:makeController produtos ProductController
```

## 📝 Namespace dos Módulos

Todos os componentes criados dentro de um módulo seguem o namespace:

```
Modules\{NomeDoModulo}\{TipoDoComponente}
```

**Exemplos:**
- Model: `Modules\Produtos\Models\Produto`
- Controller: `Modules\Produtos\Http\Controllers\ProdutoController`
- Repository: `Modules\Produtos\Repositories\ProdutoRepository`
- Service: `Modules\Produtos\Services\ProdutoService`

## 🔧 Configuração

### Autoload

Os módulos são automaticamente carregados através do `composer.json`:

```json
"autoload": {
    "psr-4": {
        "Modules\\": "modules/"
    }
}
```

### Service Providers

Os Service Providers dos módulos são automaticamente registrados no arquivo `bootstrap/providers.php` quando você cria um módulo.

## 💡 Exemplos Práticos

### Exemplo 1: Criar um módulo de Produtos completo

```bash
# 1. Criar o módulo completo
php artisan modules:make Produtos

# 2. Criar models adicionais
php artisan modules:makeModel produtos Category
php artisan modules:makeModel produtos Tag

# 3. Criar repositories
php artisan modules:makeRepository produtos ProductRepository
php artisan modules:makeRepository produtos CategoryRepository

# 4. Criar services
php artisan modules:makeService produtos ProductService
php artisan modules:makeService produtos CategoryService
```

### Exemplo 2: Criar um módulo simples apenas com Model

```bash
# Isso cria o módulo "Usuarios" + Provider + Model "Usuario"
php artisan modules:makeModel usuarios
```

### Exemplo 3: Adicionar componentes a um módulo existente

```bash
# Módulo "Produtos" já existe, vamos adicionar componentes
php artisan modules:makeModel produtos Review
php artisan modules:makeRepository produtos ReviewRepository
php artisan modules:makeService produtos ReviewService
php artisan modules:makeController produtos ReviewController
```

## 📋 Lista de Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `modules:make` | Cria um módulo completo com toda estrutura |
| `modules:makeModel` | Cria um model (cria módulo se não existir) |
| `modules:makeRepository` | Cria um repository (cria módulo se não existir) |
| `modules:makeService` | Cria um service (cria módulo se não existir) |
| `modules:makeController` | Cria um controller (cria módulo se não existir) |

## ⚠️ Importante

Após criar módulos ou componentes, sempre execute:

```bash
composer dump-autoload
```

Isso garante que o Composer reconheça as novas classes criadas.

## 🎯 Boas Práticas

1. **Nomes de Módulos**: Use nomes no plural e em PascalCase (ex: `Produtos`, `Usuarios`, `Pedidos`)

2. **Organização**: Mantenha cada módulo focado em uma funcionalidade específica

3. **Namespaces**: Sempre use os namespaces corretos ao importar classes dos módulos:
   ```php
   use Modules\Produtos\Models\Produto;
   use Modules\Produtos\Repositories\ProductRepository;
   ```

4. **Service Providers**: Cada módulo tem seu próprio Service Provider onde você pode registrar bindings, rotas, views, etc.

## 🔍 Estrutura de Arquivos Gerados

### Model
```php
<?php

namespace Modules\Produtos\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produto extends Model
{
    use HasFactory;

    protected $table = 'produtos';

    protected $fillable = [
        //
    ];
}
```

### Repository
```php
<?php

namespace Modules\Produtos\Repositories;

class ProdutoRepository
{
    //
}
```

### Service
```php
<?php

namespace Modules\Produtos\Services;

class ProdutoService
{
    //
}
```

### Controller
```php
<?php

namespace Modules\Produtos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProdutoController extends Controller
{
    //
}
```

## 📚 Recursos Adicionais

- [Documentação Laravel](https://laravel.com/docs)
- [PSR-4 Autoloading](https://www.php-fig.org/psr/psr-4/)

---

**Desenvolvido para facilitar a organização e manutenção de projetos Laravel modulares.**
