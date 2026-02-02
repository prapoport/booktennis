import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';
import CancelBooking from './pages/CancelBooking';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/cancel-booking" element={<CancelBooking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
