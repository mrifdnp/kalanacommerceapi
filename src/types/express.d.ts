interface CustomJwtPayload {
    id: string;
    email: string;
    name: string;
    // ...
}

// Perluas namespace Express
declare global {
  namespace Express {
    interface Request {
      // Tambahkan properti 'user' dengan tipe payload JWT yang sudah dijamin
      user?: CustomJwtPayload; 
    }
  }
}

// Ini diperlukan agar file diperlakukan sebagai modul dan deklarasi global diterima.
export {};