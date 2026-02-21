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