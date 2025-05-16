import api from './api';

export interface PDF {
  id: string;
  title: string;
  file_size?: number;
  num_pages: number;
  created_at: string;
  updated_at?: string;
  file_path?: string;
  author?: string;
  description?: string;
}

export interface PageData {
  page_number: number;
  text: string;
  recommendation: {
    background_music: string;
    effects: Array<{
      id: string;
      timeline: number[];
    }>;
  };
}

const pdfService = {
  /**
   * Fetch all PDFs for the current user
   */
  getAllPdfs: async (): Promise<PDF[]> => {
    try {
      const response = await api.get('/pdf/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      throw error;
    }
  },

  /**
   * Get a specific PDF by ID
   */
  getPdf: async (pdfId: string): Promise<PDF> => {
    try {
      const response = await api.get(`/pdf/${pdfId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching PDF ${pdfId}:`, error);
      throw error;
    }
  },

  /**
   * Get page data for a specific page of a PDF
   */
  getPdfPage: async (pdfId: string, pageNumber: number): Promise<PageData> => {
    try {
      const response = await api.get(`/pdf/${pdfId}/page/${pageNumber}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching page ${pageNumber} of PDF ${pdfId}:`, error);
      throw error;
    }
  },

  /**
   * Upload a new PDF file
   */
  uploadPdf: async (file: File, title: string): Promise<PDF> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);

      const response = await api.post('/pdf/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  },

  /**
   * Delete a PDF by ID
   */
  deletePdf: async (pdfId: string): Promise<void> => {
    try {
      await api.delete(`/pdf/${pdfId}`);
    } catch (error) {
      console.error(`Error deleting PDF ${pdfId}:`, error);
      throw error;
    }
  },

  /**
   * Get the download URL for a PDF
   */
  getPdfDownloadUrl: (pdfId: string): string => {
    return `${api.defaults.baseURL}/pdf/${pdfId}/download`;
  }
};

export default pdfService; 