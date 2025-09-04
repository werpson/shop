package adapters

import (
	"database/sql"
	"time"

	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

var now = time.Now()

type SqlUserRepository struct {
	db *sql.DB
}

func NewSqlUserRepository(db *sql.DB) usecases.UserRepository {
	return &SqlUserRepository{db: db}
}

func (r *SqlUserRepository) Select(user entities.User) ([]entities.User, error) {
	rows, err := r.db.Query("SELECT user_id, username, f_name, l_name, permission, status, c_by, c_date, e_by, e_date FROM users WHERE shop_id = $1", user.Shop_id)

	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var users []entities.User
	for rows.Next() {
		var u entities.User
		if err := rows.Scan(&u.ID, &u.Username, &u.F_name, &u.L_name, &u.Permission, &u.Status, &u.C_by, &u.C_date, &u.E_by, &u.E_date); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, nil
}

func (r *SqlUserRepository) Insert(user entities.User) error {
	_, err := r.db.Exec("INSERT INTO users(username, password, f_name, l_name, permission, status, c_by, c_date, e_by, e_date, shop_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
		user.Username, user.Password, user.F_name, user.L_name, user.Permission, user.Status, user.C_by, now, user.E_by, user.E_date, user.Shop_id)
	return err
}

func (r *SqlUserRepository) Update(user entities.User) error {
	if user.Password != "" {
		_, err := r.db.Exec("UPDATE users SET password = $1 WHERE user_id = $2", user.Password, user.ID)
		if err != nil {
			return err
		}
	}
	_, err := r.db.Exec("UPDATE users SET username = $1, f_name = $2, l_name = $3, permission = $4, status = $5, e_by = $6, e_date = $7 WHERE user_id = $8",
		user.Username, user.F_name, user.L_name, user.Permission, user.Status, user.E_by, now, user.ID)
	return err
}

func (r *SqlUserRepository) Delete(user entities.User) error {
	_, err := r.db.Exec("UPDATE users SET status = 'u', e_by = $1, e_date = $2 WHERE user_id = $3", user.E_by, now, user.ID)
	return err
}

func (r *SqlUserRepository) Login(user entities.User) (usecases.AuthUserRepository, error) {
	var authUser usecases.AuthUserRepository
	err := r.db.QueryRow("SELECT user_id, username, f_name, l_name, permission, shop_id FROM users WHERE user_id = $1 AND password = $2 AND status = 'a' AND shop_id = $3",
		user.ID, user.Password, user.Shop_id).Scan(&authUser.User.ID, &authUser.User.Username, &authUser.User.F_name, &authUser.User.L_name, &authUser.User.Permission, &authUser.User.Shop_id)
	if err != nil {
		if err == sql.ErrNoRows {
			return usecases.AuthUserRepository{}, nil // No matching user found
		}
		return usecases.AuthUserRepository{}, err // Other error
	}
	return authUser, nil
}
