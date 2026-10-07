<div align="center">

# Testing 1C

### Форма баг-тестирования 1С — чек-листы, скриншоты, шаринг сессий

[![Version](https://img.shields.io/badge/version-0.2.0-10b981?style=for-the-badge)](https://github.com/Antisakrum2004/testing-1C)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?style=for-the-badge&logo=neon&logoColor=white)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/license-Private-red?style=for-the-badge)](https://github.com/Antisakrum2004/testing-1C)

[Демо](https://testing-1-c.vercel.app) · [Репозиторий](https://github.com/Antisakrum2004/testing-1C)

<br/>

<img src="https://img.shields.io/github/last-commit/Antisakrum2004/testing-1C?style=flat-square&color=10b981" alt="last commit" />
<img src="https://img.shields.io/github/commit-activity/m/Antisakrum2004/testing-1C?style=flat-square&color=ef4444" alt="commits" />
<img src="https://img.shields.io/github/languages/top/Antisakrum2004/testing-1C?style=flat-square" alt="top language" />
<img src="https://img.shields.io/github/repo-size/Antisakrum2004/testing-1C?style=flat-square&color=orange" alt="repo size" />

</div>

---

## О проекте

**Testing 1C** — web-форма для баг-тестирования конфигураций 1С: тёмная glass-тема, карточки тест-кейсов, чекбоксы «совпало», скриншоты, приоритеты, статусы, комментарии и шаринг сессии по URL.

Данные хранятся в Prisma (SQLite локально / Neon Postgres на Vercel), файлы скриншотов — как base64 в БД (serverless-friendly).

| | |
|:---|:---|
| **Сессия** | заголовок, участники, статистика |
| **Пункты** | описание · ожидание · баг · скрин · assignee |
| **Коллаб** | URL-sharing · комментарии · auto-save |

---

## Возможности

<table>
<tr>
<td width="50%" valign="top">

### Тест-форма
- Dark glass UI в стиле форм задач
- Карточки тест-пунктов
- Чекбокс «совпало / баг»
- Приоритет · статус · исполнитель · время
- Скриншоты с превью
- Повтор / удаление / фильтры
- Автосохранение

</td>
<td width="50%" valign="top">

### Платформа
- CRUD сессий и items (API)
- Статистика: bugs / matched / time
- Neon serverless adapter
- next-auth / shadcn / Tailwind
- `.env.example` для локального запуска

</td>
</tr>
</table>

---

## Архитектура

```text
┌──────────────────────────────────────────────────────┐
│  Next.js page (client form)                          │
│    sessions · items · screenshots · comments         │
│              │                                       │
│              ▼                                       │
│  API routes  →  Prisma                               │
│              │                                       │
│              ▼                                       │
│  SQLite (dev)  /  Neon Postgres (Vercel)             │
└──────────────────────────────────────────────────────┘
```

---

## Стек технологий

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,prisma,nodejs,vercel,git,github" alt="Tech stack" />
</p>

| Слой | Технологии |
|:-----|:-----------|
| **UI** | Next.js 16 · React 19 · TypeScript · Tailwind · shadcn/ui |
| **Данные** | Prisma · Neon serverless · base64 uploads |
| **Деплой** | Vercel · Bun |

---

## Быстрый старт

```bash
bun install          # или npm install
cp .env.example .env
bun run db:push
bun run dev          # http://localhost:3000
```

На Vercel укажи `DATABASE_URL` (Neon). Секреты не коммитить.

---

## Структура репозитория

```text
testing-1C/
├── prisma/                  # схема TestSession / TestItem
├── src/app/                 # форма + API routes
├── public/
├── .env.example
└── package.json
```

---

## Ссылки

| | |
|:---|:---|
| Репозиторий | https://github.com/Antisakrum2004/testing-1C |
| Production | https://testing-1-c.vercel.app |

---

<div align="center">

**Testing 1C · баг-тесты без хаоса в чатах**

<img src="https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge" alt="made with love" />

</div>
