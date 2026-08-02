import { describe, it, expect, beforeEach } from 'vitest';
import { getMask, saveMask, generateMaskWithHf } from './api';
import { server } from '../tests/mocks/server';
import { http, HttpResponse } from 'msw';

describe('API - Máscaras (con MSW)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("access_token", "test-token");
  });

  describe('getMask', () => {
    it('debe retornar null si la respuesta es 404', async () => {
      // Sobrescribimos el handler para que retorne 404
      server.use(
        http.get('*/metalografia/mask/:id/', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const result = await getMask(1);
      expect(result).toBeNull();
    });

    it('debe retornar la máscara y parsear las labels si el request es exitoso', async () => {
      // Usa el handler por defecto que definimos en handlers.ts (retorna 200)
      const result = await getMask(1);
      expect(result).toEqual({
        mask_type: 'hf_segmentation',
        mask_url: 'http://test.url/mask.png',
        labels: {
          '0': { name: 'Fase A', color: [255, 0, 0] }
        }
      });
    });
  });

  describe('saveMask', () => {
    it('debe enviar la máscara procesada como blob y retornar la url resultante', async () => {
      const result = await saveMask(1, 'data:image/png;base64,123', { '0': { name: 'A', color: [255,0,0] } });
      
      expect(result).toBe('http://test.url/new-mask.png');
    });
  });

  describe('generateMaskWithHf', () => {
    it('debe enviar una imagen al endpoint de HF y retornar una data url para la máscara generada', async () => {
      // Mockeamos la descarga de la imagen original
      server.use(
        http.get('http://mi-imagen.com/img.jpg', () => {
          return new HttpResponse(new Blob(['dummy'], { type: 'image/jpeg' }));
        })
      );

      const result = await generateMaskWithHf('http://mi-imagen.com/img.jpg');
      
      expect(result).toHaveProperty('url');
      expect(result.url).toBe('http://test.hf/mask.png');
    });
  });
});
