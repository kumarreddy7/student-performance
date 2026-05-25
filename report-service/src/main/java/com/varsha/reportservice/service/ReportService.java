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

    public byte[] generateWatchlistPdf(String token, String branch, List<String> sections, String counselorUsername) {
        // Fetch data
        Map<String, Object> dashboardSummary = studentServiceClient.getDashboardSummary(token, branch, sections, counselorUsername);
        
        // Extract records
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> records = (List<Map<String, Object>>) dashboardSummary.get("studentsAtRisk");

        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Student Attendance Watchlist Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Table
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.0f, 3.0f, 3.5f, 1.5f});

            // Headers
            String[] headers = {"Roll Number", "Name", "Email Address", "Attendance Rate"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Data
            if (records != null) {
                for (Map<String, Object> record : records) {
                    table.addCell(record.get("rollNumber") != null ? String.valueOf(record.get("rollNumber")) : "");
                    table.addCell(record.get("firstName") + " " + record.get("lastName"));
                    table.addCell(record.get("email") != null ? String.valueOf(record.get("email")) : "");
                    double rate = record.get("attendanceRate") != null ? ((Number) record.get("attendanceRate")).doubleValue() : 0.0;
                    table.addCell(String.format("%.1f%%", rate));
                }
            }

            document.add(table);
            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    public byte[] generateWatchlistExcel(String token, String branch, List<String> sections, String counselorUsername) {
        // Fetch data
        Map<String, Object> dashboardSummary = studentServiceClient.getDashboardSummary(token, branch, sections, counselorUsername);
        
        // Extract records
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> records = (List<Map<String, Object>>) dashboardSummary.get("studentsAtRisk");

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
             
            XSSFSheet sheet = workbook.createSheet("Student Watchlist");
            
            // Set header row
            XSSFRow headerRow = sheet.createRow(0);
            String[] headers = {"Roll Number", "Name", "Email Address", "Attendance Rate"};
            for (int i = 0; i < headers.length; i++) {
                XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            
            int rowIdx = 1;
            if (records != null) {
                for (Map<String, Object> record : records) {
                    XSSFRow row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(record.get("rollNumber") != null ? String.valueOf(record.get("rollNumber")) : "");
                    row.createCell(1).setCellValue(record.get("firstName") + " " + record.get("lastName"));
                    row.createCell(2).setCellValue(record.get("email") != null ? String.valueOf(record.get("email")) : "");
                    double rate = record.get("attendanceRate") != null ? ((Number) record.get("attendanceRate")).doubleValue() : 0.0;
                    row.createCell(3).setCellValue(String.format("%.1f%%", rate));
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

