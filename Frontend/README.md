# React + Vite

## Google Sign-In

1. Tạo Firebase Web App trong Firebase Console và bật `Authentication > Sign-in method > Google`.
2. Sao chép `.env.example` thành `.env`, rồi điền các giá trị `VITE_FIREBASE_*` từ Firebase Project settings.
3. Tạo Firebase service account, tải JSON về máy và đặt biến môi trường Backend:
	`FIREBASE_CREDENTIALS_PATH=G:\\path\\to\\firebase-service-account.json`
4. Khởi động lại Backend và Frontend. Nút `Continue with Google` sẽ xác thực Firebase rồi đổi sang JWT nội bộ của ứng dụng.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
