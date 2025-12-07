// src/main/resources/static/js/scripts.js: DEDICATED BOOKING INTEGRATION LOGIC

// --- 1. CONFIGURATION ---
// FOR LOCAL
const API_BASE_URL = 'http://localhost:8081/api/bookings';

// ✅ CORRECTED: Use your live Railway backend URL
//const API_BASE_URL = 'https://prakrutiresortsfullstack-production.up.railway.app/api/bookings';

// --- 2. SELECTORS ---
const bookingForm = document.querySelector('.booking form');
const bookingSection = document.querySelector('.booking');

// --- 3. HELPER FUNCTION: DATE FORMATTING ---
const formatDateDisplay = (dateString) => {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// --- 4. CORE FUNCTION: CHECK AVAILABILITY (/check-availability) ---
const handleAvailabilityCheck = async (e) => {
  e.preventDefault();

  document.querySelectorAll('.availability__result_card, .availability__no_rooms, .guest__form__section, .room__availability').forEach(el => el.remove());

  const arrivalDate = document.getElementById('arrival').value;
  const departureDate = document.getElementById('departure').value;
  const numberOfGuests = parseInt(document.getElementById('guests').value);

  if (!arrivalDate || !departureDate || numberOfGuests < 1 || new Date(arrivalDate) >= new Date(departureDate)) {
    console.error("Validation Error: Please select valid arrival/departure dates and number of guests.");
    return;
  }

  const payload = { arrivalDate, departureDate, numberOfGuests };

  const checkBtn = bookingForm.querySelector('.btn');
  const originalText = checkBtn.innerText;
  checkBtn.innerText = 'Checking...';
  checkBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (data.status === 'AVAILABLE' && data.rooms?.length > 0) {
      displayAvailableRooms(data.rooms, arrivalDate, departureDate, numberOfGuests);
    } else {
      displayNoRooms(data.message || "No rooms available for the selected criteria.");
    }
  } catch (error) {
    console.error('Error fetching availability:', error);
    displayNoRooms("A connection error occurred. Please ensure the backend server is running and the API is correct.");
  } finally {
    checkBtn.innerText = originalText;
    checkBtn.disabled = false;
  }
};

// --- 5. UI DISPLAY FUNCTIONS ---
const displayNoRooms = (message) => {
  const noRoomsHtml = `
    <div class="section__container availability__no_rooms" style="text-align: center; padding-top: 2rem;">
      <h3 class="section__header" style="color: var(--secondary-color); font-size: 2rem; margin-top: 0;">${message}</h3>
    </div>
  `;
  bookingSection.insertAdjacentHTML('afterend', noRoomsHtml);
};

const displayAvailableRooms = (rooms, arrival, departure, guests) => {
  const diffDays = Math.ceil(Math.abs(new Date(departure) - new Date(arrival)) / (1000 * 60 * 60 * 24));
  const sectionId = 'available-rooms-section';

  let roomsHtml = `
    <section class="section__container room__availability" id="${sectionId}" style="padding-top: 2rem;">
      <h2 class="section__header" style="margin-bottom: 2rem;">
        Available Rooms (${formatDateDisplay(arrival)} - ${formatDateDisplay(departure)})
      </h2>
      <div class="room__grid availability__result_card" style="margin-top: 0;">
  `;

  rooms.forEach(room => {
    const totalPrice = (room.price * diffDays).toFixed(2);
    roomsHtml += `
      <div class="room__card" data-room-id="${room.roomId}">
        <img src="assets/room-1.jpg" alt="${room.name}" />
        <div class="room__card__details">
          <div>
            <h4>${room.name}</h4>
            <p>Max Guests: ${guests} | Available: ${room.availableCount}</p>
          </div>
          <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
            <div>
              <h3>₹${room.price.toFixed(2)}<span>/night</span></h3>
              <p>Total: ₹${totalPrice} (${diffDays} nights)</p>
            </div>
            <button
              class="btn select-room-btn"
              data-room-id="${room.roomId}"
              data-room-name="${room.name}"
              data-price-per-night="${room.price.toFixed(2)}"
              data-total-price="${totalPrice}"
              data-arrival="${arrival}"
              data-departure="${departure}"
              data-guests="${guests}"
            >Select Room</button>
          </div>
        </div>
      </div>
    `;
  });

  roomsHtml += `</div></section>
    <section class="section__container guest__form__section" id="guest-details-form-section" style="display: none;">
      <h2 class="section__header">Guest & Reservation Details</h2>
      <form id="guest-details" class="booking__container">
        <input type="hidden" id="form-room-id">
        <input type="hidden" id="form-arrival-date">
        <input type="hidden" id="form-departure-date">
        <input type="hidden" id="form-guests">
        <input type="hidden" id="form-total-price">
        <h4 id="selected-room-summary"></h4>
        <div class="input__group">
          <label for="guest-name">Full Name</label>
          <input type="text" id="guest-name" required placeholder="Enter your full name"/>
        </div>
        <div class="input__group">
          <label for="guest-email">Email Address</label>
          <input type="email" id="guest-email" required placeholder="Enter your email"/>
        </div>
        <p>Amount Due: <span id="amount-display"></span></p>
        <button class="btn" type="submit">Confirm Reservation & Pay</button>
      </form>
    </section>
  `;

  bookingSection.insertAdjacentHTML('afterend', roomsHtml);

  const newSection = document.getElementById(sectionId);
  if (newSection) newSection.scrollIntoView({ behavior: 'smooth' });

  document.querySelectorAll('.select-room-btn').forEach(button => {
    button.addEventListener('click', handleRoomSelection);
  });
};

// --- 6. ROOM SELECTION HANDLER ---
const handleRoomSelection = (e) => {
  const btn = e.target;
  document.getElementById('form-room-id').value = btn.dataset.roomId;
  document.getElementById('form-arrival-date').value = btn.dataset.arrival;
  document.getElementById('form-departure-date').value = btn.dataset.departure;
  document.getElementById('form-guests').value = btn.dataset.guests;
  document.getElementById('form-total-price').value = btn.dataset.totalPrice;

  document.getElementById('selected-room-summary').innerText = `${btn.dataset.roomName} | ${btn.dataset.guests} Guests`;
  document.getElementById('amount-display').innerText = `₹${btn.dataset.totalPrice}`;
  document.querySelector('.room__availability').style.display = 'none';

  const guestFormSection = document.getElementById('guest-details-form-section');
  guestFormSection.style.display = 'block';
  guestFormSection.scrollIntoView({ behavior: 'smooth' });
};

// --- 7. RAZORPAY INTEGRATION ---
const initiateRazorpayCheckout = (orderId, keyId, amountInRupees, name, email) => {
  const amountInPaise = Math.round(amountInRupees * 100);
  const options = {
    key: keyId,
    amount: amountInPaise,
    currency: "INR",
    name: "Prakruti Resorts Booking",
    description: "Room Reservation Payment",
    order_id: orderId,
    handler: function (response) {
      // ✅ CORRECTED: Use live Railway URL for payment success redirect
      window.location.href = `https://prakrutiresortsfullstack-production.up.railway.app/api/payment/success?razorpay_order_id=${response.razorpay_order_id}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_signature=${response.razorpay_signature}`;
    },
    prefill: { name, email, contact: '9999999999' },
    theme: { color: "#6B7280" }
  };
  new Razorpay(options).open();
};

// --- 8. FINAL RESERVATION & PAYMENT ---
const handleFinalReservation = async (e) => {
  e.preventDefault();

  const finalPayload = {
    roomId: document.getElementById('form-room-id').value,
    arrivalDate: document.getElementById('form-arrival-date').value,
    departureDate: document.getElementById('form-departure-date').value,
    numberOfGuests: parseInt(document.getElementById('form-guests').value),
    price: parseFloat(document.getElementById('form-total-price').value),
    name: document.getElementById('guest-name').value,
    email: document.getElementById('guest-email').value
  };

  const submitButton = document.querySelector('#guest-details button');
  submitButton.innerText = 'Processing Reservation...';
  submitButton.disabled = true;

  try {
    const reserveResponse = await fetch(`${API_BASE_URL}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    });

    const reservationData = await reserveResponse.json();
    if (!reserveResponse.ok || !reservationData.bookingId)
      throw new Error(reservationData.message || 'Failed to create reservation.');

    // ✅ CORRECTED: Use live Railway URL for Razorpay order creation
    const orderResponse = await fetch(`https://prakrutiresortsfullstack-production.up.railway.app/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: reservationData.bookingId, amount: reservationData.amount }),
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok || !orderData.orderId)
      throw new Error(orderData.error || 'Failed to create Razorpay Order.');

    initiateRazorpayCheckout(orderData.orderId, orderData.razorpayKeyId, reservationData.amount, finalPayload.name, finalPayload.email);
  } catch (error) {
    console.error('Reservation/Payment process error:', error);
    submitButton.innerText = 'Confirm Reservation & Pay';
    submitButton.disabled = false;
  }
};

// --- 9. DATE CONSTRAINTS ---
const setupDateConstraints = () => {
  const arrivalInput = document.getElementById('arrival');
  const departureInput = document.getElementById('departure');
  if (arrivalInput && departureInput) {
    const today = new Date().toISOString().split('T')[0];
    arrivalInput.min = today;
    arrivalInput.addEventListener('change', (e) => {
      const minDate = e.target.value;
      departureInput.min = minDate;
      if (departureInput.value && new Date(departureInput.value) <= new Date(minDate))
        departureInput.value = '';
    });
    departureInput.min = arrivalInput.value || today;
  }
};

// --- 10. EVENT LISTENERS ---
bookingForm.addEventListener('submit', handleAvailabilityCheck);
document.addEventListener('submit', (e) => {
  if (e.target.id === 'guest-details') handleFinalReservation(e);
});
setupDateConstraints();