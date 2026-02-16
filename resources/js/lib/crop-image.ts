/**
 * Cria um objeto Image a partir de uma URL (object URL ou data URL).
 */
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (e) => reject(e));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
}

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Recorta a imagem conforme a área em pixels e retorna um Blob.
 */
export async function getCroppedImageBlob(
    imageSrc: string,
    pixelCrop: CropArea,
    mimeType: string = 'image/jpeg',
    quality: number = 0.92,
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2d context not available');
    }

    const { x, y, width, height } = pixelCrop;

    canvas.width = Math.round(width);
    canvas.height = Math.round(height);

    ctx.drawImage(
        image,
        Math.round(x),
        Math.round(y),
        Math.round(width),
        Math.round(height),
        0,
        0,
        Math.round(width),
        Math.round(height),
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob from canvas'));
                }
            },
            mimeType,
            quality,
        );
    });
}
