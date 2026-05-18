export function useCamera() {
  const takePhoto = (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = (e: any) => {
        const file = e.target.files?.[0] ?? null;
        resolve(file);
      };

      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  };

  const pickFromGallery = (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = (e: any) => {
        const file = e.target.files?.[0] ?? null;
        resolve(file);
      };

      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  };

  return { takePhoto, pickFromGallery };
}