import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryPanel from '../FileManager/GalleryPanel';
import { useDataStore } from '../../store/useDataStore';

vi.mock('../FileManager/SubComponents', () => ({
  ResponsiveGallery: ({ onImageClick }: any) => (
    <div 
      data-testid="responsive-gallery" 
      onClick={() => onImageClick({ url: 'http://test/1.png' })}
    />
  )
}));

vi.mock('../../utils/calibration', () => ({
  ENABLE_AUTOCALIBRATION: true
}));

describe('GalleryPanel', () => {
  const mockProps = {
    galleryTitle: 'Test Gallery',
    showGalleryLegend: false,
    setShowGalleryLegend: vi.fn(),
    setShowAdminLegend: vi.fn(),
    setShowReportLegendModal: vi.fn(),
    galleryImages: [
      { name: 'Img 1', url: 'http://test/1.png' },
      { name: 'Img 2', url: 'http://test/2.png' },
    ],
    companyEnabled: true,
    galleryCalibrableByUrl: {},
    galleryCalibratedByUrl: {},
    calibratingByUrl: {},
    failedCalibrationByUrl: {},
    calibrationData: {},
    microMaterialHasModelByUrl: {},
    measureEventsById: {},
    fixImageUrl: (url: any) => url,
    galleryView: { kind: 'all' as const },
    microSiblingsByUrl: {
      'http://test/1.png': [
        { name: 'Img 1', url: 'http://test/1.png' },
        { name: 'Img Sibling', url: 'http://test/sibling.png' }
      ]
    },
    setLightboxImages: vi.fn(),
    setLightboxIndex: vi.fn(),
    closeMenu: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useDataStore.setState({ apiMicrografias: [{ id: '1', imagen: 'http://test/1.png' } as any] });
  });

  it('debe renderizar el título de la galería y la cantidad de imágenes', () => {
    render(<GalleryPanel {...mockProps} />);
    
    expect(screen.getByText('Test Gallery')).toBeInTheDocument();
    expect(screen.getByText('2 imágenes')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-gallery')).toBeInTheDocument();
  });

  it('debe llamar a closeMenu al hacer clic en el contenedor principal', async () => {
    const user = userEvent.setup();
    const { container } = render(<GalleryPanel {...mockProps} />);
    
    // El primer div es el contenedor de la isla
    await user.click(container.firstChild as Element);
    expect(mockProps.closeMenu).toHaveBeenCalled();
  });

  it('debe mostrar la leyenda de la galería al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    render(<GalleryPanel {...mockProps} />);
    
    const legendBtn = screen.getByTitle('Leyenda de íconos');
    await user.click(legendBtn);
    
    expect(mockProps.setShowGalleryLegend).toHaveBeenCalled();
    expect(mockProps.setShowAdminLegend).toHaveBeenCalledWith(false);
    expect(mockProps.setShowReportLegendModal).toHaveBeenCalledWith(false);
  });

  it('debe mostrar el dropdown de la leyenda si showGalleryLegend es true', async () => {
    const user = userEvent.setup();
    render(<GalleryPanel {...mockProps} showGalleryLegend={true} />);
    
    expect(screen.getByText('Leyenda Galería')).toBeInTheDocument();
    
    // Verificar que los ítems de ENABLE_AUTOCALIBRATION se rendericen
    expect(screen.getByText('Autocalibración exitosa')).toBeInTheDocument();
    expect(screen.getByText('Autocalibrando (o en cola)')).toBeInTheDocument();
    expect(screen.getByText('Error en autocalibración')).toBeInTheDocument();

    // Comprobar stopPropagation en el dropdown
    const dropdown = screen.getByText('Leyenda Galería').closest('div[data-legend-dropdown]');
    if (dropdown) {
      await user.click(dropdown);
      // No debe llamar a closeMenu porque paramos la propagación
      expect(mockProps.closeMenu).not.toHaveBeenCalled();
    }
  });

  it('debe cerrar la leyenda al hacer clic en la X del dropdown', async () => {
    const user = userEvent.setup();
    render(<GalleryPanel {...mockProps} showGalleryLegend={true} />);
    
    const closeBtn = screen.getByText('Leyenda Galería').nextElementSibling as Element;
    await user.click(closeBtn);
    expect(mockProps.setShowGalleryLegend).toHaveBeenCalledWith(false);
  });

  it('debe pasar las props correspondientes y manejar onImageClick normalmente', async () => {
    const user = userEvent.setup();
    render(<GalleryPanel {...mockProps} />);
    
    const gallery = screen.getByTestId('responsive-gallery');
    await user.click(gallery);
    
    // Busca en galleryImages y usa ese índice
    expect(mockProps.setLightboxImages).toHaveBeenCalledWith(mockProps.galleryImages);
    expect(mockProps.setLightboxIndex).toHaveBeenCalledWith(0);
  });

  it('debe manejar onImageClick usando microSiblingsByUrl cuando la vista es de 1 sola micrografía', async () => {
    const user = userEvent.setup();
    render(<GalleryPanel 
      {...mockProps} 
      galleryView={{ kind: 'micrografias', images: [{url: 'http://test/1.png'}] } as any} 
    />);
    
    const gallery = screen.getByTestId('responsive-gallery');
    await user.click(gallery);
    
    // Usa microSiblingsByUrl porque es una single-micro view
    expect(mockProps.setLightboxImages).toHaveBeenCalledWith(mockProps.microSiblingsByUrl['http://test/1.png']);
    expect(mockProps.setLightboxIndex).toHaveBeenCalledWith(0);
  });

  it('debe manejar onImageClick y no hacer nada si la imagen no se encuentra (índice -1)', async () => {
    const user = userEvent.setup();
    render(<GalleryPanel {...mockProps} galleryImages={[]} />);
    
    const gallery = screen.getByTestId('responsive-gallery');
    await user.click(gallery); // Hace click buscando 'http://test/1.png' que ya no está en galleryImages
    
    expect(mockProps.setLightboxImages).not.toHaveBeenCalled();
    expect(mockProps.setLightboxIndex).not.toHaveBeenCalled();
  });
});

