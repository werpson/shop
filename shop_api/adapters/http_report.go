package adapters

import (
	"bytes"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jung-kurt/gofpdf"
	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

func RegisterReportRoutes(app *fiber.App, productUsecase usecases.ProductUsecase) {
	app.Get("/report/inventory/pdf", func(c *fiber.Ctx) error {
		products, err := productUsecase.SelectProduct(entities.Product{})
		if err != nil {
			return c.Status(500).SendString("ไม่สามารถดึงข้อมูลสินค้าได้")
		}

		pdf := gofpdf.New("P", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("THSarabun", "", 16)

		// Header
		pdf.Cell(0, 10, "รายงานคลังสินค้า")
		pdf.Ln(8)
		pdf.SetFont("", "", 12)
		pdf.Cell(0, 8, "วันที่ออกรายงาน: "+time.Now().Format("02/01/2006 15:04:05"))
		pdf.Ln(12)

		// Table Header
		pdf.SetFont("", "B", 14)
		pdf.CellFormat(10, 10, "ลำดับ", "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 10, "ชื่อสินค้า", "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 10, "ประเภท", "1", 0, "C", false, 0, "")
		pdf.CellFormat(20, 10, "จำนวน", "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 10, "ราคา/หน่วย", "1", 0, "C", false, 0, "")
		pdf.CellFormat(30, 10, "มูลค่ารวม", "1", 0, "C", false, 0, "")
		pdf.CellFormat(20, 10, "สถานะ", "1", 1, "C", false, 0, "")
		pdf.SetFont("", "", 14)

		var total float64 = 0
		for i, p := range products {
			pdf.CellFormat(10, 10, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
			pdf.CellFormat(40, 10, p.Name, "1", 0, "L", false, 0, "")
			pdf.CellFormat(25, 10, p.Type, "1", 0, "C", false, 0, "")
			pdf.CellFormat(20, 10, fmt.Sprintf("%d", p.Quantity), "1", 0, "C", false, 0, "")
			pdf.CellFormat(25, 10, formatPrice(float64(p.Price)), "1", 0, "R", false, 0, "")
			val := float64(p.Quantity) * float64(p.Price)
			pdf.CellFormat(30, 10, formatPrice(val), "1", 0, "R", false, 0, "")
			status := "ใช้งาน"
			if p.Status == "u" {
				status = "ยกเลิก"
			}
			pdf.CellFormat(20, 10, status, "1", 1, "C", false, 0, "")
			total += val
		}

		// Summary
		pdf.Ln(4)
		pdf.SetFont("", "B", 14)
		pdf.CellFormat(120, 10, "รวมมูลค่าทั้งหมด", "1", 0, "R", false, 0, "")
		pdf.CellFormat(30, 10, formatPrice(total), "1", 1, "R", false, 0, "")
		c.Set("Content-Type", "application/pdf")
		var buf bytes.Buffer
		err = pdf.Output(&buf)
		if err != nil {
			return c.Status(500).SendString("ไม่สามารถสร้าง PDF ได้")
		}
		return c.SendStream(&buf)
	})
}

func formatPrice(price float64) string {
	return fmt.Sprintf("%.2f", price)
}
