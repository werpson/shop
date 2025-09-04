# ---- Stage 1: Build the Go application ----
# ใช้ image ที่มี compiler สำหรับ Go
FROM golang:1.25-alpine AS builder

# กำหนด working directory
WORKDIR /app

# คัดลอกไฟล์ go.mod และ go.sum เพื่อ cache dependencies
COPY go.mod go.sum ./

# ดาวน์โหลด dependencies
RUN go mod download

# คัดลอก source code ทั้งหมด
COPY . .

# คอมไพล์โปรแกรม Go
# CGO_ENABLED=0 เพื่อสร้าง binary ที่ไม่ขึ้นกับ OS (static binary)
# -o main เพื่อกำหนดชื่อไฟล์ output เป็น main
# ./main.go คือไฟล์ main ของโปรแกรม
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./main.go

# ---- Stage 2: Run the application ----
# ใช้ image ที่มีขนาดเล็กที่สุดเพื่อรันโปรแกรม
FROM alpine:latest


# กำหนด working directory ใน container ใหม่ ให้ตรงกับ docker-compose.yml
WORKDIR /app

# คัดลอกไฟล์ binary ที่สร้างจาก stage แรกมาใส่ใน /app
COPY --from=builder /app/main .

# เปิด port ที่แอปพลิเคชันต้องการ
EXPOSE 8081

# สั่งให้ container รันไฟล์ binary ที่คัดลอกมา
CMD ["./main"]