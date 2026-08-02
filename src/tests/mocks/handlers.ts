import { http, HttpResponse } from 'msw';

export const handlers = [
  // Ejemplo de handler base. Los tests pueden sobrescribir esto con server.use()
  http.get('*/metalografia/mask/:id/', () => {
    return HttpResponse.json({
      mask_type: 'hf_segmentation',
      mask_url: 'http://test.url/mask.png',
      labels: {
        '0': { name: 'Fase A', color: [255, 0, 0] }
      }
    });
  }),

  http.post('*/metalografia/predict/:id/', () => {
    return HttpResponse.json({ image_url: 'http://test.url/new-mask.png' });
  }),

  http.post('*/predict', () => {
    // Para el endpoint de Hugging Face
    return HttpResponse.json({
      mask_url: 'http://test.hf/mask.png',
      labels: {}
    });
  }),
  
  http.post('*/segment/:id/rgb/', () => {
    return HttpResponse.json({
      mask_url: 'http://test.hf/mask.png',
      labels: {}
    });
  })
];
