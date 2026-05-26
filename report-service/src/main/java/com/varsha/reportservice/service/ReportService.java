package com.varsha.reportservice.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.varsha.reportservice.client.AnalyticsServiceClient;
import com.varsha.reportservice.client.StudentServiceClient;
import com.varsha.reportservice.dto.StudentDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFCell;
import java.util.List;
import java.util.Map;


@Service
public class ReportService {

    @Autowired
    private StudentServiceClient studentServiceClient;

    @Autowired
    private AnalyticsServiceClient analyticsServiceClient;

    public byte[] generateWatchlistPdf(String token) {
        // Fetch data
        List<StudentDTO> students = studentServiceClient.getAllStudents(token);
        Map<String, Object> analyticsSummary = analyticsServiceClient.getDashboardSummary(token);
        
        // Extract records
        List<Map<String, Object>> records = (List<Map<String, Object>>) analyticsSummary.get("records");

        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Student Watchlist Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Table
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 1.5f, 1.5f, 1.5f});

            // Headers
            String[] headers = {"Student ID", "Name", "GPA", "Risk Score", "Category"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Data
            if (records != null) {
                for (Map<String, Object> record : records) {
                    String category = (String) record.get("riskCategory");
                    if ("HIGH".equals(category) || "MEDIUM".equals(category)) {
                        Long studentId = ((Number) record.get("studentId")).longValue();
                        StudentDTO student = students.stream().filter(s -> s.getId().equals(studentId)).findFirst().orElse(null);
                        
                        table.addCell(String.valueOf(studentId));
                        table.addCell(student != null ? student.getFirstName() + " " + student.getLastName() : "Unknown");
                        table.addCell(String.valueOf(record.get("gpa")));
                        table.addCell(String.valueOf(record.get("riskScore")));
                        table.addCell(category);
                    }
                }
            }

            document.add(table);
            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    public byte[] generateWatchlistExcel(String token) {
        // Fetch data
        List<StudentDTO> students = studentServiceClient.getAllStudents(token);
        Map<String, Object> analyticsSummary = analyticsServiceClient.getDashboardSummary(token);
        
        // Extract records
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> records = (List<Map<String, Object>>) analyticsSummary.get("records");

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
             
            XSSFSheet sheet = workbook.createSheet("Student Watchlist");
            
            // Set header row
            XSSFRow headerRow = sheet.createRow(0);
            String[] headers = {"Student ID", "Name", "GPA", "Risk Score", "Category"};
            for (int i = 0; i < headers.length; i++) {
                XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            
            int rowIdx = 1;
            if (records != null) {
                for (Map<String, Object> record : records) {
                    String category = (String) record.get("riskCategory");
                    if ("HIGH".equals(category) || "MEDIUM".equals(category)) {
                        Long studentId = ((Number) record.get("studentId")).longValue();
                        StudentDTO student = students.stream()
                                .filter(s -> s.getId().equals(studentId))
                                .findFirst()
                                .orElse(null);
                        
                        XSSFRow row = sheet.createRow(rowIdx++);
                        row.createCell(0).setCellValue(studentId);
                        row.createCell(1).setCellValue(student != null ? student.getFirstName() + " " + student.getLastName() : "Unknown");
                        row.createCell(2).setCellValue(record.get("gpa") != null ? ((Number) record.get("gpa")).doubleValue() : 0.0);
                        row.createCell(3).setCellValue(record.get("riskScore") != null ? ((Number) record.get("riskScore")).doubleValue() : 0.0);
                        row.createCell(4).setCellValue(category);
                    }
                }
            }
            
            // Auto size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            e.printStackTrace();
            return new byte[0];
        }
    }
}

