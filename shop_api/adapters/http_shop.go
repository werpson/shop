package adapters

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/werpson/shop/auth"
	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

type HttpShopHandler struct {
	shopUseCase usecases.ShopUseCase
}

func NewHttpShopHandler(useCase usecases.ShopUseCase) *HttpShopHandler {
	return &HttpShopHandler{shopUseCase: useCase}
}

type HttpShopHandlerLogin struct {
	authUseCase usecases.AuthShopUseCase
}

func NewHttpShopHandlerLogin(authUseCase usecases.AuthShopUseCase) *HttpShopHandlerLogin {
	return &HttpShopHandlerLogin{authUseCase: authUseCase}
}

func (h *HttpShopHandler) GetShops(c *fiber.Ctx) error {
	var shop entities.Shop

	shops, err := h.shopUseCase.SelectShop(shop)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(shops)
}

func (h *HttpShopHandler) CreateShop(c *fiber.Ctx) error {
	var shop entities.Shop

	shop.Shop_name = c.FormValue("name")
	shop.Password = c.FormValue("password")

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	}

	err = c.SaveFile(file, "./uploads/shop/"+file.Filename)

	if err != nil {
		return c.SendStatus(fiber.StatusBadGateway)
	}

	shop.Image = file.Filename

	if err := h.shopUseCase.InsertShop(shop); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusCreated)
}

func (h *HttpShopHandler) UpdateShop(c *fiber.Ctx) error {
	var shop entities.Shop

	shop.Shop_name = c.FormValue("name")
	shop.Password = c.FormValue("password")

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	}

	err = c.SaveFile(file, "./uploads/shop/"+file.Filename)

	if err != nil {
		return c.SendStatus(fiber.StatusBadGateway)
	}

	shop.Image = file.Filename

	if err := h.shopUseCase.UpdateShop(shop); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusOK)
}

func (h *HttpShopHandler) DeleteShop(c *fiber.Ctx) error {
	var shop entities.Shop
	if err := c.BodyParser(&shop); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := h.shopUseCase.DeleteShop(shop.ID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *HttpShopHandlerLogin) Login(c *fiber.Ctx) error {
	var shop entities.Shop
	if err := c.BodyParser(&shop); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	authShop, err := h.authUseCase.Login(shop)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if authShop.Shop.ID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}
	// สร้าง JWT token ด้วยฟังก์ชันใหม่
	token, err := auth.GenerateShopJWT(&authShop.Shop)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "token_shop",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour), // กำหนดเวลาในการหมดอายุของคุกกี้
		HTTPOnly: true,
		Secure:   false, // ปรับเป็น true ถ้าใช้ HTTPS
		Path:     "/",
		SameSite: "None",
	})

	return c.Status(fiber.StatusOK).JSON("Login Shop successful")
}

func ShopLogout(c *fiber.Ctx) error {
	cookie := fiber.Cookie{
		Name:     "token_shop",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour), // ตั้งค่าวันหมดอายุเป็นอดีตเพื่อทำให้คุกกี้หมดอายุ
		HTTPOnly: true,
		SameSite: "None",
	}
	c.Cookie(&cookie)
	return c.SendStatus(fiber.StatusOK)
}
