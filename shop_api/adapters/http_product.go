package adapters

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/werpson/shop/auth"
	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

type HttpProductHandler struct {
	productusecase usecases.ProductUsecase
}

func NewHttpProductHandler(useCase usecases.ProductUsecase) *HttpProductHandler {
	return &HttpProductHandler{productusecase: useCase}
}

func (h *HttpProductHandler) GetProducts(c *fiber.Ctx) error {
	var product entities.Product
	shopID, err := auth.GetShopIDFromUserJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	product.Shop_id = shopID

	products, err := h.productusecase.SelectProduct(product)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(products)
}

func (h *HttpProductHandler) CreateProduct(c *fiber.Ctx) error {
	var product entities.Product

	product.BarCode = c.FormValue("barcode")
	product.Name = c.FormValue("name")
	quantityStr := c.FormValue("quantity")
	quantity, err := strconv.Atoi(quantityStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid quantity"})
	}
	product.Quantity = quantity

	priceStr := c.FormValue("price")
	price, err := strconv.Atoi(priceStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid price"})
	}

	product.Price = price
	product.Detail = c.FormValue("detail")
	product.Type = c.FormValue("type")

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	}

	err = c.SaveFile(file, "./uploads/products/"+file.Filename)
	if err != nil {
		return c.SendStatus(fiber.StatusBadGateway)
	}
	product.Image = file.Filename

	var productHistory entities.ProductHistory
	user_id, err := auth.GetUserIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	productHistory.By = user_id

	product.Shop_id, err = auth.GetShopIDFromUserJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	if err := h.productusecase.InsertProduct(product, productHistory); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(product)
}

func (h *HttpProductHandler) UpdateProduct(c *fiber.Ctx) error {
	var product entities.Product

	IDStr := c.FormValue("id")
	ID, err := strconv.Atoi(IDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID"})
	}
	product.ID = ID

	product.Name = c.FormValue("name")
	quantityStr := c.FormValue("quantity")
	quantity, err := strconv.Atoi(quantityStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid quantity"})
	}
	product.Quantity = quantity

	priceStr := c.FormValue("price")
	price, err := strconv.Atoi(priceStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid price"})
	}

	product.Price = price
	product.Detail = c.FormValue("detail")
	product.Type = c.FormValue("type")

	file, err := c.FormFile("image")
	if err != nil {
		// If no file is uploaded, continue without updating the image
		product.Image = ""
	} else {
		err = c.SaveFile(file, "./uploads/products/"+file.Filename)
		if err != nil {
			return c.SendStatus(fiber.StatusBadGateway)
		}
		product.Image = file.Filename
	}

	var productHistory entities.ProductHistory
	user_id, err := auth.GetUserIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	productHistory.By = user_id

	if err := h.productusecase.UpdateProduct(product, productHistory); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(product)
}

func (h *HttpProductHandler) DeleteProduct(c *fiber.Ctx) error {
	var product entities.Product
	if err := c.BodyParser(&product); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	var productHistory entities.ProductHistory
	user_id, err := auth.GetUserIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	productHistory.By = user_id

	if err := h.productusecase.DeleteProduct(product, productHistory); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
