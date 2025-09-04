package adapters

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/werpson/shop/auth"
	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

type HttpUserHandler struct {
	userUseCase usecases.UserUseCase
}

type HttpUserHandlerLogin struct {
	authUserUseCase usecases.AuthUserUseCase
}

func NewHttpUserHandler(useCase usecases.UserUseCase) *HttpUserHandler {
	return &HttpUserHandler{userUseCase: useCase}
}

func NewHttpUserHandlerLogin(authUserUseCase usecases.AuthUserUseCase) *HttpUserHandlerLogin {
	return &HttpUserHandlerLogin{authUserUseCase: authUserUseCase}
}

func (h *HttpUserHandler) GetUser(c *fiber.Ctx) error {
	var user entities.User

	user_shopid, err := auth.GetShopIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	user.Shop_id = user_shopid

	users, err := h.userUseCase.SelectUser(user)
	if err != nil {
		return err
	}
	return c.JSON(users)
}

func (h *HttpUserHandler) CreateUser(c *fiber.Ctx) error {
	var user entities.User

	user.Username = c.FormValue("username")
	user.Password = c.FormValue("password")
	user.F_name = c.FormValue("first_name")
	user.L_name = c.FormValue("last_name")
	user.Permission = c.FormValue("permission")
	user.Status = "a"

	// file, err := c.FormFile("image")
	// if err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	// }

	// err = c.SaveFile(file, "./uploads/users/"+file.Filename)

	// if err != nil {
	// 	return c.SendStatus(fiber.StatusBadGateway)
	// }

	// user.Image = file.Filename

	user_shopid, err := auth.GetShopIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorizederreberbs"})
	}

	user.Shop_id = user_shopid

	user_id, err := auth.GetUserIDFromJWT(c)
	if err != nil {
		user.C_by = 0
	}
	user.C_by = user_id

	if err := h.userUseCase.InsertUser(user); err != nil {
		return err
	}
	return c.JSON(user)
}

func (h *HttpUserHandler) UpdateUser(c *fiber.Ctx) error {
	var user entities.User
	user.Username = c.FormValue("username")
	user.Password = c.FormValue("password")
	user.F_name = c.FormValue("first_name")
	user.L_name = c.FormValue("last_name")
	user.Permission = c.FormValue("permission")
	user.Status = "a"

	// file, err := c.FormFile("image")
	// if err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	// }

	// err = c.SaveFile(file, "./uploads/shop/"+file.Filename)

	// if err != nil {
	// 	return c.SendStatus(fiber.StatusBadGateway)
	// }

	// user.Image = file.Filename

	user_id, err := auth.GetUserIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	user.E_by = user_id

	if err := h.userUseCase.UpdateUser(user); err != nil {
		return err
	}
	return c.JSON(user)
}

func (h *HttpUserHandler) DeleteUser(c *fiber.Ctx) error {
	var user entities.User
	user.Username = c.FormValue("username")
	user.Password = c.FormValue("password")
	user.F_name = c.FormValue("first_name")
	user.L_name = c.FormValue("last_name")
	user.Permission = c.FormValue("permission")
	user.Status = "a"

	// file, err := c.FormFile("image")
	// if err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	// }

	// err = c.SaveFile(file, "./uploads/shop/"+file.Filename)

	// if err != nil {
	// 	return c.SendStatus(fiber.StatusBadGateway)
	// }

	// user.Image = file.Filename

	user_id, err := auth.GetUserIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	user.E_by = user_id

	if err := h.userUseCase.DeleteUser(user); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusOK)
}

func (h *HttpUserHandlerLogin) Login(c *fiber.Ctx) error {
	var user entities.User
	if err := c.BodyParser(&user); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	user_shopid, err := auth.GetShopIDFromJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	user.Shop_id = user_shopid

	authUser, err := h.authUserUseCase.Login(user)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	if authUser.User.ID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err})
	}
	// สร้าง JWT token ด้วยฟังก์ชันใหม่
	token, err := auth.GenerateUserJWT(&authUser.User)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	// ส่ง token กลับไปยังผู้ใช้
	if token == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Token generation failed"})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "token_user",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour), // กำหนดเวลาในการหมดอายุของคุกกี้
		HTTPOnly: true,
		SameSite: "None",
	})

	return c.Status(fiber.StatusOK).JSON("Login User successful")
}

func UserLogout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "token_user",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		SameSite: "None",
	})
	return c.SendStatus(fiber.StatusOK)
}
