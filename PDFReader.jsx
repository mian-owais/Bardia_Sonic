'use client';

import { useState, useEffect } from 'react';

const PDFReader = ({ pdfUrl }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-screen"
      title="PDF Reader"
    />
  );
};

export default PDFReader;