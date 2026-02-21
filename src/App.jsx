import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Order from "./pages/Order";
import ContactUs from "./pages/ContactUs";
import Cart from "./pages/Cart";
import ProductDets from "./pages/ProductDets";
import AdminProducts from "./pages/AdminProducts";
import Checkout from "./pages/Checkout";
import PickUp from "./pages/PickUp";
import Worker from "./pages/Worker";
import WorkerLogin from "./pages/WorkerLogin";
import WorkerSignUp from "./pages/WorkerSignup";
import Logout from "./pages/Logout";

const token = localStorage.getItem("token");

export default function App() {
  return (
    <Routes>
      {/* Main Public Routes (Wrapped in Layout) */}
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/About' element={<About />} />
        <Route path='/Contact' element={<ContactUs />} />
        <Route path='/Products' element={<Products />} />
        <Route path='/Order' element={<Order />} />
        <Route path='/Cart' element={<Cart />} />
        <Route path='/Checkout' element={<Checkout />} />
        <Route path='/Pickup' element={<PickUp />} />
        <Route path='/product/:id' element={<ProductDets />} />
      </Route>

      {/* Auth & Admin Routes (No Standard Layout) */}
      <Route path='/SignIn' element={<SignIn />} />
      <Route path='/SignUp' element={<SignUp />} />
      <Route path='/Logout' element={<Logout />} />

      {/* Worker / Admin */}
      <Route path='/Worker' element={<Worker />} />
      <Route path='/WorkerLogin' element={<WorkerLogin />} />
      <Route path='/WorkerSignup' element={<WorkerSignUp />} />
      <Route path="/admin" element={<AdminProducts token={token} />} />
      <Route path="/admin/products" element={<AdminProducts token={token} />} />
    </Routes>
  );
}