import { toastController } from '@ionic/vue';

export function useToast() {
  async function show(message: string, color: string, duration = 2500) {
    const toast = await toastController.create({
      message, duration, color, position: 'bottom',
    });
    await toast.present();
  }

  return {
    success: (msg: string) => show(msg, 'success'),
    error:   (msg: string) => show(msg, 'danger', 3500),
    warning: (msg: string) => show(msg, 'warning'),
    info:    (msg: string) => show(msg, 'medium'),
  };
}