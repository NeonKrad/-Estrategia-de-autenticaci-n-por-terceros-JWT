// app.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const app = express();
const PORT = 3000;

// Simulamos una base de datos de usuarios (en una aplicación real, esto sería una base de datos real)
const users = [
  {
    id: 1,
    email: 'adminCoder@coder.com',
    passwordHash: '$2b$10$cuCjFsQhOqFjZzUAFJXbGe0sv/fBRYpRq15UUDT/Qck5W3jUrh3Au', // Password: adminCod3r123
    role: 'admin',
  },
  {
    id: 2,
    email: 'user@example.com',
    passwordHash: '$2b$10$wUjgNMe81/hNwa3rSW/w1eA8YttIlHJPGs4nXMlCGuUrgfsXHRCQi', // Password: user123
    role: 'user',
  },
];

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'your-secret-key', // Cambia esta clave secreta en un entorno real
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Configurar la estrategia local de passport para el login
passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    const user = users.find((u) => u.email === email);
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado.' });
    }

    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return done(null, false, { message: 'Contraseña incorrecta.' });
    }

    return done(null, user);
  })
);

// Configurar la estrategia de passport para la autenticación con GitHub
passport.use(
  new GitHubStrategy(
    {
      clientID: 'your-github-client-id',
      clientSecret: 'your-github-client-secret',
      callbackURL: 'http://localhost:3000/auth/github/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // Aquí puedes buscar o crear un usuario basado en el perfil de GitHub
      // profile contiene la información del usuario autenticado con GitHub
      // Implementa la lógica para encontrar o crear el usuario en tu base de datos
      // Luego, pasa el usuario a la función "done".
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        role: 'user', // En este ejemplo, todos los usuarios autenticados con GitHub tendrán el rol "usuario".
      };
      return done(null, user);
    }
  )
);

// Serialización del usuario para almacenarlo en la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialización del usuario para obtenerlo de la sesión
passport.deserializeUser((id, done) => {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Ruta para la página de inicio (sin autenticación requerida)
app.get('/', (req, res) => {
  res.send('¡Bienvenido a la página de inicio!');
});

// Ruta para el formulario de login
app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="post" action="/login">
      <input type="text" name="email" placeholder="Email" required>
      <input type="password" name="password" placeholder="Contraseña" required>
      <button type="submit">Iniciar sesión</button>
    </form>
    <hr>
    <a href="/auth/github">Iniciar sesión con GitHub</a>
  `);
});

// Ruta para procesar el formulario de login utilizando passport
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/productos');
});

// Ruta para la autenticación con GitHub
app.get('/auth/github', passport.authenticate('github'));

// Ruta para la callback de autenticación con GitHub
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/productos');
});

// Ruta para la página de productos (requiere autenticación)
app.get('/productos', isAuthenticated, (req, res) => {
  const user = req.user;
  res.send(`
    <h1>Productos</h1>
    <p>Bienvenido ${user.email || user.displayName} - Rol: ${user.role}</p>
    <a href="/logout">Cerrar sesión</a>
  `);
});

// Ruta para el logout
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});
