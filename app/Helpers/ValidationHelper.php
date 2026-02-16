<?php

namespace App\Helpers;

class ValidationHelper
{
    /**
     * Valida CPF.
     */
    public static function validateCpf(string $cpf): bool
    {
        $cpf = preg_replace('/[^\d]+/', '', $cpf);

        if (strlen($cpf) != 11 || preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }

        $add = 0;
        for ($i = 0; $i < 9; $i++) {
            $add += (int) $cpf[$i] * (10 - $i);
        }
        $rev = 11 - ($add % 11);
        if ($rev == 10 || $rev == 11) {
            $rev = 0;
        }

        if ($rev != (int) $cpf[9]) {
            return false;
        }

        $add = 0;
        for ($i = 0; $i < 10; $i++) {
            $add += (int) $cpf[$i] * (11 - $i);
        }

        $rev = 11 - ($add % 11);
        if ($rev == 10 || $rev == 11) {
            $rev = 0;
        }

        return $rev == (int) $cpf[10];
    }

    /**
     * Valida CNPJ.
     */
    public static function validateCnpj(string $cnpj): bool
    {
        $cnpj = preg_replace('/[^\d]+/', '', $cnpj);

        if (strlen($cnpj) != 14 || preg_match('/(\d)\1{13}/', $cnpj)) {
            return false;
        }

        $soma = 0;
        for ($i = 0, $j = 5; $i < 12; $i++) {
            $soma += (int) $cnpj[$i] * $j;
            $j = $j == 2 ? 9 : $j - 1;
        }
        $resto = $soma % 11;
        $dv1 = $resto < 2 ? 0 : 11 - $resto;

        $soma = 0;
        for ($i = 0, $j = 6; $i < 13; $i++) {
            $soma += (int) $cnpj[$i] * $j;
            $j = $j == 2 ? 9 : $j - 1;
        }
        $resto = $soma % 11;
        $dv2 = $resto < 2 ? 0 : 11 - $resto;

        return $cnpj[12] == $dv1 && $cnpj[13] == $dv2;
    }

    /**
     * Gera um slug a partir de uma string.
     */
    public static function generateSlug(string $text): string
    {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text);
        $text = trim($text, '-');

        return $text;
    }
}
