// src/main/resources/static/js/scripts.js: DEDICATED BOOKING INTEGRATION LOGIC

// --- 1. CONFIGURATION ---
const API_BASE_URL = 'http://localhost:8080/api/bookings';

// --- 2. SELECTORS ---
// Select the form element inside the .booking section for the initial check
const bookingForm = document.querySelector('.booking form');
// Select the whole section to insert results right after it
const bookingSection = document.querySelector('.booking'); 

// --- 3. HELPER FUNCTION: DATE FORMATTING ---
const formatDateDisplay = (dateString) => {
    // Converts "2025-10-02" to "2 Oct 2025" for display
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// --- 4. CORE FUNCTION: CHECK AVAILABILITY (/check-availability) ---

const handleAvailabilityCheck = async (e) => {
    e.preventDefault(); // Stop the default HTML form submission

    // Clear any previous dynamic content
    document.querySelectorAll('.availability__result_card, .availability__no_rooms, .guest__form__section, .room__availability').forEach(el => el.remove());

    const arrivalDate = document.getElementById('arrival').value;
    const departureDate = document.getElementById('departure').value;
    const numberOfGuests = parseInt(document.getElementById('guests').value); 

    // Basic client-side validation - Using console.error instead of alert()
    if (!arrivalDate || !departureDate || numberOfGuests < 1 || new Date(arrivalDate) >= new Date(departureDate)) {
        console.error("Validation Error: Please select valid arrival/departure dates and number of guests.");
        return;
    }

    const payload = {
        arrivalDate: arrivalDate,
        departureDate: departureDate,
        numberOfGuests: numberOfGuests
    };
    
    // Temporarily change button text/style to show loading
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'AVAILABLE' && data.rooms && data.rooms.length > 0) {
            displayAvailableRooms(data.rooms, arrivalDate, departureDate, numberOfGuests);
        } else {
            displayNoRooms(data.message || "No rooms available for the selected criteria.");
        }
    } catch (error) {
        console.error('Error fetching availability:', error);
        displayNoRooms("A connection error occurred. Please ensure the backend server is running and the API is correct.");
    } finally {
        // Restore button state
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
    const diffTime = Math.abs(new Date(departure) - new Date(arrival));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Assign a unique ID to the section for scrolling
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
                <div class="room__card__details" style="transform: none; position: static; margin: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem;">
                    <div>
                        <h4>${room.name}</h4>
                        <p>Max Guests: ${guests} | Available: ${room.availableCount}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <div style="text-align: left;">
                            <h3>₹${room.price.toFixed(2)}<span>/night</span></h3>
                            <p style="font-size: 0.9rem; font-weight: 600; color: var(--text-dark);">Total: ₹${totalPrice} (${diffDays} nights)</p>
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

    roomsHtml += `
            </div>
        </section>
        
        <section class="section__container guest__form__section" id="guest-details-form-section" style="display: none; padding-top: 0;">
            <h2 class="section__header" style="margin-bottom: 2rem;">Guest & Reservation Details</h2>
            <form id="guest-details" class="booking__container" style="max-width: 500px; padding: 2rem; border: 1px solid var(--extra-light); border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); background-color: var(--white);">
                <input type="hidden" id="form-room-id">
                <input type="hidden" id="form-arrival-date">
                <input type="hidden" id="form-departure-date">
                <input type="hidden" id="form-guests">
                <input type="hidden" id="form-total-price">
                
                <h4 id="selected-room-summary" style="margin-bottom: 1.5rem; color: var(--primary-color);"></h4>

                <div class="input__group">
                    <label for="guest-name" style="color: var(--text-dark);">Full Name</label>
                    <input type="text" id="guest-name" required placeholder="Enter your full name" style="color: var(--text-dark); background-color: var(--white); border-bottom: 1px solid var(--text-light);"/>
                </div>
                <div class="input__group">
                    <label for="guest-email" style="color: var(--text-dark);">Email Address</label>
                    <input type="email" id="guest-email" required placeholder="Enter your email" style="color: var(--text-dark); background-color: var(--white); border-bottom: 1px solid var(--text-light);"/>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <p style="font-weight: 600; color: var(--text-dark);">Amount Due: <span id="amount-display" style="color: var(--secondary-color);"></span></p>
                </div>
                <button class="btn" type="submit" style="margin-top: 1.5rem;">Confirm Reservation & Pay</button>
            </form>
        </section>
    `;
    bookingSection.insertAdjacentHTML('afterend', roomsHtml);

    // --- NEW SCROLLING LOGIC: Scroll down to the newly displayed rooms ---
    const newSection = document.getElementById(sectionId);
    if (newSection) {
        newSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Attach event listeners to the new 'Select Room' buttons
    document.querySelectorAll('.select-room-btn').forEach(button => {
        button.addEventListener('click', handleRoomSelection);
    });
};

// --- 6. ROOM SELECTION HANDLER ---

const handleRoomSelection = (e) => {
    const btn = e.target;
    
    // Get data from the clicked button (data-* attributes)
    const roomId = btn.dataset.roomId;
    const roomName = btn.dataset.roomName;
    const totalPrice = btn.dataset.totalPrice;
    const guests = btn.dataset.guests;
    
    // Hide availability results
    const availabilitySection = document.querySelector('.room__availability');
    if (availabilitySection) {
        availabilitySection.style.display = 'none';
    }


    // Populate the hidden form fields
    document.getElementById('form-room-id').value = roomId;
    document.getElementById('form-arrival-date').value = btn.dataset.arrival;
    document.getElementById('form-departure-date').value = btn.dataset.departure;
    document.getElementById('form-guests').value = guests;
    document.getElementById('form-total-price').value = totalPrice;
    
    // Update the summary text for the user
    const summaryText = `${roomName} | ${guests} Guests`;
    document.getElementById('selected-room-summary').innerText = summaryText;
    document.getElementById('amount-display').innerText = `₹${totalPrice}`;
    
    // Show the guest details form section
    const guestFormSection = document.getElementById('guest-details-form-section');
    guestFormSection.style.display = 'block';
    
    // Scroll the user down to the form
    guestFormSection.scrollIntoView({ behavior: 'smooth' });
};


// --- NEW RAZORPAY INTEGRATION CODE ---

// A separate function to handle opening the payment modal
const initiateRazorpayCheckout = (orderId, keyId, amountInRupees, name, email) => {
    const amountInPaise = Math.round(amountInRupees * 100);
    const options = {
        key: keyId, 
        amount: amountInPaise, // amount in smallest currency unit (Paise)
        currency: "INR",
        name: "Prakruti Resorts Booking",
        description: "Room Reservation Payment",
        order_id: orderId, 
        handler: function (response) {
            // This function is executed by Razorpay on successful payment.
            // It redirects the user to our server endpoint for verification.
            window.location.href = `/api/payment/success?razorpay_order_id=${response.razorpay_order_id}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_signature=${response.razorpay_signature}`;
        },
        modal: {
            ondismiss: function() { 
                // Restore button state if the user closes the modal. Using console.warn()
                console.warn("Payment was closed or cancelled by the user. Please try again.");
                const submitButton = document.querySelector('#guest-details button');
                submitButton.innerText = 'Confirm Reservation & Pay';
                submitButton.disabled = false;
            }
        },
        prefill: {
            name: name,
            email: email,
            contact: '9999999999' // Placeholder contact number
        },
        theme: {
            color: "#6B7280"
        }
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
};


// --- 7. FINAL RESERVATION AND PAYMENT (/reserve) - UPDATED FOR RAZORPAY FLOW ---

const handleFinalReservation = async (e) => {
    e.preventDefault();

    const finalPayload = {
        roomId: document.getElementById('form-room-id').value,
        arrivalDate: document.getElementById('form-arrival-date').value,
        departureDate: document.getElementById('form-departure-date').value,
        numberOfGuests: parseInt(document.getElementById('form-guests').value),
        price: parseFloat(document.getElementById('form-total-price').value), // Total Price in Rupees
        name: document.getElementById('guest-name').value,
        email: document.getElementById('guest-email').value
    };
    
    const submitButton = document.querySelector('#guest-details button');
    submitButton.innerText = 'Processing Reservation...';
    submitButton.disabled = true;

    try {
        // Step 1: Create a PENDING Booking in our own database
        const reserveResponse = await fetch(`${API_BASE_URL}/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalPayload),
        });

        const reservationData = await reserveResponse.json();

        if (!reserveResponse.ok || !reservationData.bookingId) {
            throw new Error(reservationData.message || 'Failed to create local reservation.');
        }

        const bookingId = reservationData.bookingId;
        const amountInRupees = reservationData.amount;
        
        // Step 2: Request a Razorpay Order ID from our Backend
        const orderResponse = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: bookingId,
                amount: amountInRupees 
            }),
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.orderId) {
            throw new Error(orderData.error || 'Failed to create Razorpay Order. Check backend logs.');
        }
        
        // Step 3: Open the Razorpay Checkout Modal
        initiateRazorpayCheckout(
            orderData.orderId, 
            orderData.razorpayKeyId, // Key ID from backend
            amountInRupees, 
            finalPayload.name, 
            finalPayload.email 
        );

    } catch (error) {
        console.error('Reservation/Payment process error:', error);
        // Using console.error() instead of alert()
        console.error(`UI Notification: An error occurred during payment processing: ${error.message}. Please check console.`); 
        
        submitButton.innerText = 'Confirm Reservation & Pay';
        submitButton.disabled = false;
    }
};


// --- 8. DATE CONSTRAINTS & EVENT LISTENERS ATTACHMENT ---

/**
 * Sets up listeners to enforce that the arrival date cannot be in the past,
 * and the departure date cannot be before the arrival date.
 */
const setupDateConstraints = () => {
    const arrivalInput = document.getElementById('arrival');
    const departureInput = document.getElementById('departure');

    if (arrivalInput && departureInput) {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Set the minimum selectable date for Arrival (cannot be in the past)
        arrivalInput.setAttribute('min', today);

        // 2. Listener for Arrival Date change
        arrivalInput.addEventListener('change', (e) => {
            const selectedArrivalDate = e.target.value;
            
            // Set the minimum selectable date for Departure to be the selected arrival date
            departureInput.setAttribute('min', selectedArrivalDate);
            
            // If the currently selected departure date becomes invalid, clear it
            if (departureInput.value && new Date(departureInput.value) <= new Date(selectedArrivalDate)) {
                departureInput.value = '';
            }
        });

        // Set initial min constraint for departure in case arrival has a value on load
        departureInput.setAttribute('min', arrivalInput.value || today);
    }
};


// Listener for the initial check availability form
bookingForm.addEventListener('submit', handleAvailabilityCheck);

// Listener for the dynamically created guest details form (uses event delegation for safety)
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'guest-details') {
        handleFinalReservation(e);
    }
});

// Run the date constraint setup when the script loads
setupDateConstraints();