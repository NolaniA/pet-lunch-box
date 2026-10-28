# Pet Lunch Box

เว็บสำหรับให้ผู้ใช้แต่ละบัญชีตั้งเวลาให้อาหารของตัวเอง พร้อมเฟิร์มแวร์ ESP32-C3 โอเพนซอร์สให้ดาวน์โหลดไปติดตั้งบนอุปกรณ์ของผู้ใช้ รวม source ทั้งสองส่วนไว้ใน repository เดียว

- **เว็บ:** Next.js 15, React 18, TypeScript, HeroUI และ Tailwind CSS 4
- **ข้อมูลและบัญชี:** Supabase Auth + PostgreSQL พร้อม Row Level Security
- **อุปกรณ์:** ESP32-C3, Wi-Fi setup portal, NTP และ continuous-rotation servo

## โครงสร้างโปรเจกต์

```text
app/                    หน้าเว็บและ API
components/             ส่วนติดต่อผู้ใช้
lib/                    กติกาตารางอาหารและ HTTP helpers
utils/supabase/          Supabase clients สำหรับแต่ละบริบท
supabase/migrations/    SQL สำหรับฐานข้อมูลใหม่
firmware/esp32c3/        เฟิร์มแวร์หลักที่พัฒนาต่อจาก v4
firmware/legacy/         รุ่น v1–v3 สำหรับอ้างอิงเท่านั้น
tests/                  การทดสอบกติกา API และ PostgreSQL
docs/                   สถาปัตยกรรม API และแนวทางดูแลระบบ
```

## สำหรับผู้ใช้

1. อ่านหน้า About เพื่อดูการทำงานของระบบ แล้วสมัครหรือล็อกอินบนเว็บ Pet Lunch Box
2. ตั้งค่าและบันทึกตารางอาหารของบัญชีตัวเอง
3. เปิดหน้า Device เพื่อคัดลอก API endpoint และ personal device token ของตัวเอง
4. ดาวน์โหลด source ZIP จากหน้า Firmware ซึ่งเปิดสาธารณะโดยไม่ต้องล็อกอิน
5. ติดตั้งเฟิร์มแวร์บน ESP ของตัวเอง แล้วกรอก Wi-Fi และข้อมูลเชื่อมต่อจากหน้า Device ใน setup portal

ผู้ใช้ไม่ต้องสร้างฐานข้อมูลหรือโปรเจกต์ Supabase เอง ระบบเว็บใช้ backend กลางและแยกข้อมูลตามบัญชีผู้ใช้ เฟิร์มแวร์สาธารณะไม่มี token ของผู้ใช้ฝังอยู่

## สำหรับผู้ดูแลเว็บ: รันโปรเจกต์เอง

ผู้ดูแลระบบต้องมี Node.js 22 ขึ้นไป (CI ใช้ Node.js 24) และโปรเจกต์ Supabase กลางสำหรับเว็บหนึ่งชุด

```bash
npm ci
```

คัดลอก `.env.example` เป็น `.env.local` แล้วกรอก:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

ระบบใช้ anon key กับ RLS และ RPC ที่ตรวจสิทธิ์ ไม่ต้องใส่ service-role key

1. สำหรับ **ฐานข้อมูลใหม่** รัน [initial migration](supabase/migrations/202610280001_initial_schema.sql) ใน Supabase SQL Editor
2. หากใช้ฐานข้อมูลเดิม ให้อ่าน [database guide](docs/database.md) ก่อน ห้ามรัน initial schema ทับตารางเดิม
3. เปิด Email Auth และตั้ง Site URL กับ Redirect URLs เช่น `http://localhost:3000/auth/callback` และ URL ของเว็บจริง
4. หากใช้ GitHub sign-in ให้เปิด provider ใน Supabase และตั้ง OAuth callback ตาม dashboard ของ Supabase
5. รันเว็บ:

```bash
npm run dev
```

เปิด [localhost:3000](http://localhost:3000) สมัครบัญชี ยืนยันอีเมล แล้วเพิ่มมื้ออาหารได้สูงสุด 10 มื้อต่อวัน ใช้เวลา **Asia/Bangkok (UTC+7)** ระยะเวลาหมุน 0–60 วินาที ค่า 0 คือพักมื้อนั้น ตารางว่างคือพักทุกมื้อ

หน้าแรกสำหรับคนที่ยังไม่ล็อกอินเป็น About ซึ่งอธิบายการทำงานและประโยชน์ พร้อมเมนู About และ Firmware เมื่อเข้าสู่ระบบแล้วจึงแสดง Schedule และ Device หากผู้ดูแลยังไม่ตั้ง environment variables หน้า About และ Firmware ยังเปิดได้ แต่การเข้าสู่ระบบจะยังไม่พร้อมใช้งาน

## เฟิร์มแวร์โอเพนซอร์สสำหรับผู้ใช้

หน้า Firmware มีตัวเลือก **Arduino IDE** เป็นค่าเริ่มต้น หรือ **PlatformIO (Python)** ผู้ใช้ Arduino IDE ไม่ต้องติดตั้ง Python เอง ส่วน Python ใช้สำหรับติดตั้งเครื่องมือ PlatformIO บนคอมพิวเตอร์ เฟิร์มแวร์ทั้งสองวิธีเป็น source Arduino/C++ ชุดเดียวกัน

รายละเอียดและการต่อสายอยู่ใน [firmware guide](firmware/README.md)

```bash
python -m pip install -r firmware/requirements.txt
pio run -d firmware
pio run -d firmware -t upload
pio device monitor -d firmware
```

เปิดหน้า **Device** บนเว็บ คัดลอก endpoint และ token แยกกัน บนบอร์ดเชื่อมต่อ Wi-Fi `PetLunchBox-XXXX` ด้วยรหัสที่แสดงใน Serial Monitor แล้วเปิด `http://192.168.4.1` เพื่อบันทึกข้อมูล

**การต่อสาย:** เฟิร์มแวร์คง pin เดิมจากต้นฉบับ โดย servo ใช้ **GPIO9** และใช้ PWM สำหรับ continuous-rotation servo ไม่ต้องเปลี่ยนสายจากโปรเจกต์เดิม

## แพ็ก source เฟิร์มแวร์สำหรับดาวน์โหลด

ไฟล์ `public/downloads/pet-lunch-box-esp32c3-source.zip` ให้ผู้ใช้ดาวน์โหลดจากหน้า Firmware เมื่อแก้ source หรือคู่มือเฟิร์มแวร์ให้แพ็กใหม่:

```bash
python scripts/package_firmware.py
python scripts/package_firmware.py --check
```

แพ็กเกจรวม source, build config, คู่มือ และ LICENSE โดยไม่รวมค่า Wi-Fi หรือ token ของผู้ใช้ CI ตรวจให้ ZIP ตรงกับ source ปัจจุบัน

## ตรวจคุณภาพ

```bash
npm run check
npm run build
pio run -d firmware
```

- `npm run lint` ตรวจโค้ดโดยไม่แก้ไฟล์; `npm run lint:fix` แก้ข้อที่แก้ได้อัตโนมัติ
- `npm run typecheck` ตรวจ TypeScript
- `npm test` ทดสอบ validation, API authentication, token rotation, RLS และธุรกรรมฐานข้อมูลผ่าน PGlite
- `npm run format:check` / `npm run format` ตรวจและจัดรูปแบบโค้ดเว็บกับเอกสาร
- GitHub Actions ตรวจเว็บและคอมไพล์เฟิร์มแวร์ทุก push / pull request

การทดสอบในเครื่องไม่จำเป็นต้องใช้ Supabase จริง เฟิร์มแวร์รุ่นเก่าไม่อยู่ใน build ของ PlatformIO

## เอกสารเพิ่มเติม

- [Architecture](docs/architecture.md)
- [API contract](docs/api.md)
- [Database setup and existing installations](docs/database.md)
- [Integration provenance and changes](docs/integration.md)
- [Verification evidence and remaining hardware checks](docs/verification.md)

โค้ดเว็บเริ่มจาก [NolaniA/pet-lunch-box](https://github.com/NolaniA/pet-lunch-box) และเฟิร์มแวร์จาก [NolaniA/esp32c3-auto-feed](https://github.com/NolaniA/esp32c3-auto-feed) ดู commit ต้นทางใน integration guide โดยเก็บ LICENSE เดิมของ repo หลักไว้
