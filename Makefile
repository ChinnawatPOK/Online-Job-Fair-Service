.DEFAULT_GOAL := help
.PHONY: help setup install env db-up db-down db-reset seed dev start test

setup: install env db-up seed ## ตั้งค่าครั้งแรกครบ: install, env, เปิด DB, seed
	@echo "พร้อมแล้ว รัน 'make dev' ได้เลย"

install: ## ติดตั้ง dependencies
	npm install

# ====================================
db-up: ## เปิด PostgreSQL ด้วย Docker
	docker compose up -d --wait db

db-down: ## ปิด PostgreSQL (ข้อมูลยังอยู่)
	docker compose down

db-reset: ## ลบ PostgreSQL พร้อมข้อมูลทั้งหมด แล้วเปิดใหม่ (ต้อง make seed ต่อ)
	docker compose down -v
	docker compose up -d --wait db
# ====================================

seed: ## ล้างข้อมูลทุกตาราง แล้วใส่ admin + บริษัทตัวอย่าง
	npm run seed

dev: ## รัน server แบบ nodemon (พอร์ต 5050)
	npm run dev

start: ## รัน server แบบปกติ
	npm start

