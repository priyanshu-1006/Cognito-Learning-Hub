import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class QuizPDFExporter {
  constructor() {
    this.defaultOptions = {
      format: 'a4',
      orientation: 'portrait',
      margin: [10, 10, 10, 10], // top, right, bottom, left
      quality: 1,
      fontSize: 12,
      lineHeight: 1.4
    };
  }

  async generateFromHTML(htmlContent, filename = 'quiz.pdf', options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      tempDiv.style.backgroundColor = '#fff';
      
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF({
        orientation: opts.orientation,
        unit: 'mm',
        format: opts.format
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = Math.min(
        (pdfWidth - opts.margin[1] - opts.margin[3]) / canvasWidth,
        (pdfHeight - opts.margin[0] - opts.margin[2]) / canvasHeight
      );
      
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      // Center the image
      const x = opts.margin[3] + (pdfWidth - opts.margin[1] - opts.margin[3] - imgWidth) / 2;
      const y = opts.margin[0];

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      // Save PDF
      pdf.save(filename);
      
      return { success: true, message: 'PDF generated successfully!' };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }

  async generateQuizPDF(quizData, questions, format = 'teacher') {
    try {
      const token = localStorage.getItem('quizwise-token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          quizData,
          questions,
          format
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const data = await response.json();
      
      // Generate PDF from HTML
      await this.generateFromHTML(data.html, data.filename);
      
      return { success: true, message: 'PDF downloaded successfully!' };
    } catch (error) {
      console.error('Error generating quiz PDF:', error);
      throw error;
    }
  }

  async generateExistingQuizPDF(quizId, format = 'teacher') {
    try {
      const token = localStorage.getItem('quizwise-token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}/pdf/${format}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const data = await response.json();
      
      // Generate PDF from HTML
      await this.generateFromHTML(data.html, data.filename);
      
      return { success: true, message: 'PDF downloaded successfully!' };
    } catch (error) {
      console.error('Error generating quiz PDF:', error);
      throw error;
    }
  }

  // Quick export methods for different formats
  async exportAsStudentCopy(quizData, questions) {
    return this.generateQuizPDF(quizData, questions, 'student');
  }

  async exportAsTeacherCopy(quizData, questions) {
    return this.generateQuizPDF(quizData, questions, 'teacher');
  }

  async exportAsAnswerKey(quizData, questions) {
    return this.generateQuizPDF(quizData, questions, 'answer-key');
  }

  // Print-friendly version (opens browser print dialog)
  async printQuiz(htmlContent) {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quiz Print</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
              body { font-family: Arial, sans-serif; }
            }
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.4; 
              color: #000; 
              background: #fff;
              margin: 20px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
      return { success: true, message: 'Print dialog opened successfully!' };
    } catch (error) {
      console.error('Error opening print dialog:', error);
      throw new Error('Failed to open print dialog: ' + error.message);
    }
  }
}

// Export singleton instance
export const pdfExporter = new QuizPDFExporter();

// Utility function for quick exports
export const exportQuizToPDF = async (quizData, questions, format = 'teacher') => {
  return pdfExporter.generateQuizPDF(quizData, questions, format);
};

export const printQuiz = async (htmlContent) => {
  return pdfExporter.printQuiz(htmlContent);
};
