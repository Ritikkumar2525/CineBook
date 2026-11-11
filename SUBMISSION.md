# 📝 Algions AI Labs Submission Form Template
**Assessment:** Advanced Individual Project Assessment — Full-Stack Web Development  
**Project:** Cinema Hall Ticket Booking System  

---

## 1. Candidate Identification
| Form Field | Entry Details |
| :--- | :--- |
| **Full Name** | *[Enter your full name]* |
| **Registration Number** | *[Enter your registration number]* |
| **University Email** | *[Enter your university email address]* |

---

## 2. Assignment Confirmation
| Form Field | Entry Details |
| :--- | :--- |
| **Internship Role** | Full-Stack Web Development |
| **Assigned Project Title**| Cinema Hall Ticket Booking System |

---

## 3. Code and Version Control
| Form Field | Entry Details |
| :--- | :--- |
| **Repository URL** | *[Paste your GitHub/GitLab Repository URL]* |
| **Primary Branch** | `main` |
| **Final Commit ID** | *[Run `git rev-parse HEAD` and paste commit hash]* |
| **Reviewer Access** | Public (or granted read access if private) |

---

## 4. Demonstration Links
| Form Field | Entry Details |
| :--- | :--- |
| **Walkthrough Video (3–5 min)** | *[Paste Loom / Google Drive / YouTube unlisted video link]* (Follow [DEMO_GUIDE.md](DEMO_GUIDE.md)) |
| **Live Web Demo URL** | Declared Local-Only Demo (run locally via `npm run dev`) or *[Paste Vercel/Render URL if hosted]* |

---

## 5. Documentation Links
| Form Field | Entry Details |
| :--- | :--- |
| **README & Setup Guide** | [`README.md`](README.md) |
| **Technical Architecture Report** | [`TECHNICAL_REPORT.md`](TECHNICAL_REPORT.md) |
| **Database ER / Schema Diagram** | [`ER_DIAGRAM.md`](ER_DIAGRAM.md) |
| **API Documentation** | [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) (Interactive UI: `http://localhost:5000/api/docs`) |
| **Walkthrough Script & Test Guide** | [`DEMO_GUIDE.md`](DEMO_GUIDE.md) |

---

## 6. Technology Stack & Limitations
| Form Field | Entry Details |
| :--- | :--- |
| **Technology Stack** | **Frontend:** React 18, Vite 5, Tailwind CSS 3, Framer Motion 11, Lucide React, Axios.<br>**Backend:** Node.js, Express.js, JWT, Helmet, CORS, QRCode.<br>**Database:** MongoDB & Mongoose (with compound unique indexes & transactions).<br>**Testing:** Vitest, Supertest. |
| **Setup Notes** | `npm run install:all` to install dependencies.<br>`npm run seed` to seed database.<br>`npm run dev` to start both frontend and backend concurrently.<br>`npm test` to run all 31 automated tests. |
| **Known Limitations & Assumptions** | 1. Payment gateway is simulated/sandboxed without 3rd-party charges per brief instructions.<br>2. Usher scanner accepts QR code booking references manually or via scanned input.<br>3. Relies on MongoDB instance on localhost:27017 or connection string in `server/.env`. |

---

## 7. Role-Specific Form Fields
| Form Field | Entry Details |
| :--- | :--- |
| **Test / Demo Account Instructions** | **Admin Account:** `admin@cinema.com` / `admin123`<br>**Customer Account:** `john@example.com` / `password123`<br>*(Both accounts are pre-seeded and accessible via 1-click buttons on the `/login` screen)* |
| **API Documentation Link** | Hosted locally at `http://localhost:5000/api/docs` (Powered by Scalar & OpenAPI 3.0.3) |
| **Database / Schema Diagram** | Detailed in [`ER_DIAGRAM.md`](ER_DIAGRAM.md) with visual Mermaid diagrams, foreign keys, and indexes |

---

## 8. AI Tools & Attribution
| Form Field | Entry Details |
| :--- | :--- |
| **AI Tools Used** | Antigravity AI Coding Assistant |
| **Purpose of Use** | Architecture scaffolding, parallel file creation, test case generation, and documentation |
| **Dataset / Library Attribution** | Mongoose, React Router, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Scalar API Reference, Vitest, Supertest |

---

## 9. Candidate Declarations
- [x] **Originality:** I certify that I understand the complete codebase and architecture, and I am prepared to explain all design decisions and debug components during the 15-minute technical walkthrough and 10-minute live task.
- [x] **No Sensitive Data:** No live payment tokens, private production keys, or sensitive credentials are committed. Only development placeholders and `.env.example` are included.
- [x] **Link Verification:** All internal documentation, test commands, and demonstration links are active and functional.
