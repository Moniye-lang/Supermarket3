import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Products from "./Pages/Products";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import Order from "./Pages/Order";
import ContactUs from "./Pages/ContactUs";
import Cart from "./Pages/Cart";
import ProductDets from "./Pages/ProductDets";
import AdminProducts from "./Pages/AdminProducts";
import Checkout from "./Pages/Checkout";
import PickUp from "./Pages/PickUp";
import Worker from "./Pages/Worker";
import WorkerLogin from "./Pages/WorkerLogin";
import WorkerSignUp from "./Pages/WorkerSignup";
import Logout from "./Pages/Logout";
import NotFound from "./Pages/NotFound";


const token = localStorage.getItem("token");

export default function App() {
  return (
    <Routes>
      {/* Main Public Routes (Wrapped in Layout) */}
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<ContactUs />} />
        <Route path='/products' element={<Products />} />
        <Route path='/order' element={<Order />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/pickup' element={<PickUp />} />
        <Route path='/product/:id' element={<ProductDets />} />
      </Route>

      {/* Auth & Admin Routes (No Standard Layout) */}
      <Route path='/signin' element={<SignIn />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/logout' element={<Logout />} />

      {/* Worker / Admin */}
      <Route path='/worker' element={<Worker />} />
      <Route path='/workerlogin' element={<WorkerLogin />} />
      <Route path='/workersignup' element={<WorkerSignUp />} />
      <Route path="/admin" element={<AdminProducts token={token} />} />
      <Route path="/admin/products" element={<AdminProducts token={token} />} />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}