<?php

namespace Modules\Cloudflare\Contracts;

use Illuminate\Http\UploadedFile;

interface FileServiceInterface
{
    /**
     * @return array{filename: string, original_filename: string, path: string, url: string, cdn_url: string, mime_type: string, size: int}
     */
    public function uploadFile(
        UploadedFile $file,
        string $directory = 'files',
    ): array;

    /**
     * Grava com o nome e o tipo que quem chama decidiu (o tipo validado pelo conteúdo,
     * nunca a extensão que o navegador mandou). Não devolve URL pública nem registra
     * o caminho no log: serve para arquivo que só abre por link assinado.
     *
     * @return array{filename: string, original_filename: string, path: string, mime_type: string, size: int}
     */
    public function uploadFileAs(
        UploadedFile $file,
        string $directory,
        string $filename,
        string $contentType,
    ): array;

    /**
     * @return array{success: array, errors: array}
     */
    public function uploadMultipleFiles(
        array $files,
        string $directory = 'files',
    ): array;

    public function deleteFile(string $path): bool;

    /**
     * Remove como o `deleteFile`, mas sem o caminho no log nem na exceção (só a pasta):
     * é a remoção do arquivo gravado pelo `uploadFileAs`, que só abre por link assinado.
     */
    public function deletePrivateFile(string $path): bool;

    public function fileExists(string $path): bool;

    public function getFileUrl(string $path): string;

    public function getFileCdnUrl(string $path): string;

    /**
     * @return array{filename: string, original_filename: string, path: string, url: string, cdn_url: string, mime_type: string, size: int}
     */
    public function uploadFromPath(
        string $localPath,
        string $directory = 'files',
        string $originalFilename = '',
    ): array;

    /**
     * @return array{upload_url: string, path: string, expires_at: string}
     */
    public function createPresignedUploadUrl(
        string $path,
        string $contentType,
        int $expiresInSeconds = 900,
    ): array;

    /**
     * Link de leitura assinado, que expira: para arquivo que não pode ter URL pública.
     * Com `$downloadFilename`, o navegador usa esse nome. Com `$contentType`, a resposta
     * sai com esse tipo; abre na tela (`inline`) só imagem comum ou PDF, o resto baixa
     * (`attachment`).
     *
     * @return array{url: string, expires_at: string}
     */
    public function createPresignedDownloadUrl(
        string $path,
        int $expiresInSeconds = 300,
        ?string $downloadFilename = null,
        ?string $contentType = null,
    ): array;
}
