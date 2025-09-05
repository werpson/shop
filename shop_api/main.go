package main

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	_ "github.com/lib/pq"
	"github.com/werpson/shop/adapters"
	"github.com/werpson/shop/auth"
	"github.com/werpson/shop/usecases"
)

const (
	host     = "localhost" // or the Docker service name if running in another container
	port     = 5432        // default PostgreSQL port
	user     = "postgres"  // as defined in docker-compose.yml
	password = "admin"     // as defined in docker-compose.yml
	dbname   = "shop"      // as defined in docker-compose.yml
)

func main() {

	app := fiber.New()

	// Rate limit: 60 requests per minute per IP
	app.Use(limiter.New(limiter.Config{
		Max:        60,
		Expiration: 60, // seconds
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "ขออภัย คุณส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (Rate limit)",
			})
		},
	}))

	app.Use(func(c *fiber.Ctx) error {
		// origin := c.Get("Origin")
		// allowedOrigins := map[string]bool{
		// 	"http://localhost:3000":     true,
		// 	"http://127.0.0.1:3000":     true,
		// 	"http://172.19.0.3:3000":    true, // docker network
		// 	"https://app.maproflow.com": true,
		// 	"http://app.maproflow.com":  true,
		// }
		// if allowedOrigins[origin] {
		// 	c.Set("Access-Control-Allow-Origin", origin)
		// }
		origin := c.Get("Origin")
		if origin != "" {
			c.Set("Access-Control-Allow-Origin", origin)
		}
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Set("Access-Control-Allow-Credentials", "true")
		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusNoContent)
		}
		return c.Next()
	})

	// Database connection
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s "+"password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	os.MkdirAll("./uploads", os.ModePerm)
	app.Static("/uploads", "./uploads")

	shopRepo := adapters.NewSQLShopRepository(db)
	shopUsecase := usecases.NewShopService(shopRepo)
	authUsecase := usecases.NewShopServiceLogin(shopRepo)
	httpShopHandler := adapters.NewHttpShopHandler(shopUsecase)
	httpAuthHandlerLogin := adapters.NewHttpShopHandlerLogin(authUsecase)

	app.Get("/shops", httpShopHandler.GetShops)
	app.Post("/shops", httpShopHandler.CreateShop)
	app.Put("/shops", httpShopHandler.UpdateShop)
	app.Delete("/shops", httpShopHandler.DeleteShop)
	app.Post("/shops/login", httpAuthHandlerLogin.Login)
	app.Post("/shops/logout", adapters.ShopLogout)

	// Initialize repository and usecase
	productRepo := adapters.NewSqlProductRepository(db)
	productUsecase := usecases.NewProductService(productRepo)
	userRepo := adapters.NewSqlUserRepository(db)
	userUsecase := usecases.NewUserService(userRepo)
	AuthUserUseCase := usecases.NewAuthUserService(userRepo)
	product_historyRepo := adapters.NewSqlProductHistoryRepository(db)
	productHistoryUsecase := usecases.NewProductHistoryService(product_historyRepo)

	// Initialize HTTP handler
	httpProductHandler := adapters.NewHttpProductHandler(productUsecase)
	httpUserHandler := adapters.NewHttpUserHandler(userUsecase)
	httpUserHandlerLogin := adapters.NewHttpUserHandlerLogin(AuthUserUseCase)
	httpProductHistoryHandler := adapters.NewHttpProductHistoryHandler(productHistoryUsecase)

	// Define routes
	app.Get("/products", httpProductHandler.GetProducts)
	app.Post("/products", httpProductHandler.CreateProduct)
	app.Put("/products", httpProductHandler.UpdateProduct)
	app.Delete("/products", httpProductHandler.DeleteProduct)

	app.Get("/users", httpUserHandler.GetUser)
	app.Post("/users", httpUserHandler.CreateUser)
	app.Put("/users", httpUserHandler.UpdateUser)
	app.Delete("/users", httpUserHandler.DeleteUser)
	app.Post("/users/login", httpUserHandlerLogin.Login)
	app.Post("/users/logout", adapters.UserLogout)

	app.Get("/product_history", httpProductHistoryHandler.GetProductHistory)
	app.Get("/product_history/top_out", httpProductHistoryHandler.GetTopOutProductHistory)
	app.Get("/product_history/top_in", httpProductHistoryHandler.GetTopInProductHistory)

	// Register inventory PDF report route
	adapters.RegisterInventoryReportRoutes(app, productHistoryUsecase)

	app.Get("/jwt_shop/check", auth.GetShopJWTCookie)
	app.Get("/jwt_user/check", auth.GetUserJWTCookie)
	// Start server
	app.Listen(":8081")
}
