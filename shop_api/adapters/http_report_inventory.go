package adapters

import (
	"bytes"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jung-kurt/gofpdf"
	"github.com/werpson/shop/auth"
	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

// RegisterInventoryReportRoutes sets up PDF report endpoints for inventory by month, quarter, year
func RegisterInventoryReportRoutes(app *fiber.App, productHistoryUsecase usecases.ProductHistoryUseCase) {
	app.Get("/report/inventory/pdf", func(c *fiber.Ctx) error {
		period := c.Query("period", "month") // month, quarter, year
		year := c.Query("year", time.Now().Format("2006"))
		month := c.Query("month", fmt.Sprintf("%02d", int(time.Now().Month())))
		// quarter := c.Query("quarter", "1")

		var productHistory entities.ProductHistory
		var product entities.Product
		var user entities.User

		// Filtering by period (month/year)
		if period == "month" {
			productHistory.Date = year + "-" + month // e.g. 2024-06
		} else if period == "year" {
			productHistory.Date = year
		}

		user_shopid, err := auth.GetShopIDFromJWT(c)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}
		product.Shop_id = user_shopid

		var monthInt, yearInt int
		if month != "" && year != "" {
			monthInt, err = strconv.Atoi(month)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid month"})
			}
			yearInt, err = strconv.Atoi(year)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid year"})
			}
		} else {
			monthInt = 0
			yearInt = 0
		}

		histories, _, _, err := productHistoryUsecase.SelectProductHistory(productHistory, product, user, monthInt, yearInt)
		if err != nil {
			return c.Status(500).SendString("ไม่สามารถดึงข้อมูลประวัติสินค้าได้")
		}

		title := "รายงานคลังสินค้า"
		var periodLabel string
		switch period {
		case "month":
			periodLabel = fmt.Sprintf("ประจำเดือน %s/%s", month, year)
		case "year":
			periodLabel = fmt.Sprintf("ประจำปี %s", year)
		default:
			periodLabel = fmt.Sprintf("ประจำเดือน %s/%s", month, year)
		}

		pdf := gofpdf.New("P", "mm", "A4", "")
		// Embed Sarabun font (regular, bold, italic, bolditalic)
		pdf.AddUTF8Font("THSarabun", "", "font/th-sarabun-psk/THSarabun.ttf")
		pdf.AddUTF8Font("THSarabun", "B", "font/th-sarabun-psk/THSarabun Bold.ttf")
		pdf.AddUTF8Font("THSarabun", "I", "font/th-sarabun-psk/THSarabun Italic.ttf")
		pdf.AddUTF8Font("THSarabun", "BI", "font/th-sarabun-psk/THSarabun Bold Italic.ttf")
		pdf.AddPage()
		pdf.SetFont("THSarabun", "", 24) // หัวเรื่องใหญ่
		pdf.Cell(0, 14, title)
		pdf.Ln(10)
		pdf.SetFont("THSarabun", "", 16)
		pdf.Cell(0, 10, periodLabel+"  วันที่ออกรายงาน: "+time.Now().Format("02/01/2006 15:04:05"))
		pdf.Ln(14)

		if len(histories) == 0 {
			pdf.SetFont("THSarabun", "B", 18)
			pdf.Cell(0, 20, "ไม่พบข้อมูลในช่วงเวลานี้")
		} else {
			// Table Header
			pdf.SetFont("THSarabun", "B", 18)
			pdf.CellFormat(10, 12, "ลำดับ", "1", 0, "C", false, 0, "")
			pdf.CellFormat(40, 12, "ชื่อสินค้า", "1", 0, "C", false, 0, "")
			pdf.CellFormat(25, 12, "ประเภท", "1", 0, "C", false, 0, "")
			pdf.CellFormat(20, 12, "จำนวน", "1", 0, "C", false, 0, "")
			pdf.CellFormat(25, 12, "ราคา/หน่วย", "1", 0, "C", false, 0, "")
			pdf.CellFormat(30, 12, "มูลค่ารวม", "1", 0, "C", false, 0, "")
			pdf.CellFormat(20, 12, "วิธีการ", "1", 1, "C", false, 0, "")
			pdf.SetFont("THSarabun", "", 16)

			// รวมเฉพาะ method ที่ต้องการ (c=สร้าง, u=อัปเดต, d=ยกเลิก)
			var total float64 = 0
			var row int = 1
			for _, h := range histories {
				// ตัวอย่าง: รวมเฉพาะ method "c" (สร้างสินค้าใหม่)
				// ถ้าต้องการรวมหลาย method ให้ปรับตรงนี้ เช่น h.Method == "c" || h.Method == "u"
				if h.Method == "d" {
					continue
				}
				pdf.CellFormat(10, 12, strconv.Itoa(row), "1", 0, "C", false, 0, "")
				pdf.CellFormat(40, 12, h.New_Name, "1", 0, "L", false, 0, "")
				pdf.CellFormat(25, 12, h.New_Type, "1", 0, "C", false, 0, "")
				pdf.CellFormat(20, 12, strconv.Itoa(h.New_Quantity), "1", 0, "C", false, 0, "")
				pdf.CellFormat(25, 12, fmt.Sprintf("%.2f", float64(h.New_Price)), "1", 0, "R", false, 0, "")
				val := float64(h.New_Quantity) * float64(h.New_Price)
				pdf.CellFormat(30, 12, fmt.Sprintf("%.2f", val), "1", 0, "R", false, 0, "")
				// แสดง method
				var methodLabel string
				switch h.Method {
				case "c":
					methodLabel = "สร้าง"
				case "u":
					methodLabel = "แก้ไข"
					if h.Old_Quantity > h.New_Quantity {
						val = -val
					} else {
						val = float64(h.New_Quantity)*float64(h.New_Price) - float64(h.Old_Quantity)*float64(h.Old_Price)
					}
				case "d":
					methodLabel = "ยกเลิก"
				default:
					methodLabel = h.Method
				}
				pdf.CellFormat(20, 12, methodLabel, "1", 1, "C", false, 0, "")

				total += val
				row++
			}

			// Summary
			pdf.Ln(6)
			pdf.SetFont("THSarabun", "B", 18)
			pdf.CellFormat(120, 12, "รวมมูลค่าทั้งหมด (เฉพาะสร้างสินค้า)", "1", 0, "R", false, 0, "")
			pdf.CellFormat(30, 12, fmt.Sprintf("%.2f", total), "1", 1, "R", false, 0, "")

			// --- ตารางสินค้าทั้งหมดในร้าน ---
			pdf.AddPage()
			pdf.SetFont("THSarabun", "B", 22)
			pdf.Cell(0, 14, "รายการสินค้าทั้งหมดในร้าน")
			pdf.Ln(12)
			pdf.SetFont("THSarabun", "B", 16)
			pdf.CellFormat(10, 10, "ลำดับ", "1", 0, "C", false, 0, "")
			pdf.CellFormat(50, 10, "ชื่อสินค้า", "1", 0, "C", false, 0, "")
			pdf.CellFormat(25, 10, "ประเภท", "1", 0, "C", false, 0, "")
			pdf.CellFormat(20, 10, "จำนวน", "1", 0, "C", false, 0, "")
			pdf.CellFormat(25, 10, "ราคา/หน่วย", "1", 0, "C", false, 0, "")
			pdf.CellFormat(30, 10, "ราคารวม", "1", 0, "C", false, 0, "")
			pdf.CellFormat(20, 10, "สถานะ", "1", 1, "C", false, 0, "")
			pdf.SetFont("THSarabun", "", 15)
		}

		c.Set("Content-Type", "application/pdf")
		var buf bytes.Buffer
		err = pdf.Output(&buf)
		if err != nil {
			return c.Status(500).SendString("PDF error: " + err.Error())
		}
		return c.SendStream(&buf)
	})
}
