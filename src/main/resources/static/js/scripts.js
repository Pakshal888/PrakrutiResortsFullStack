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
    document.querySelectorAll('.availability__result_card, .availability__no_rooms, .guest__form__section').forEach(el => el.remove());

    const arrivalDate = document.getElementById('arrival').value;
    const departureDate = document.getElementById('departure').value;
    const numberOfGuests = parseInt(document.getElementById('guests').value); 

    // Basic client-side validation
    if (!arrivalDate || !departureDate || numberOfGuests < 1 || new Date(arrivalDate) >= new Date(departureDate)) {
        alert("Please select valid arrival/departure dates and number of guests.");
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
        displayNoRooms("A connection error occurred. Please ensure the backend server is running.");
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
    
    let roomsHtml = `
        <section class="section__container room__availability" style="padding-top: 2rem;">
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
    document.querySelector('.room__availability').style.display = 'none';

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


// --- 7. FINAL RESERVATION AND PAYMENT (/reserve) ---

const handleFinalReservation = async (e) => {
    e.preventDefault();

    const finalPayload = {
        roomId: document.getElementById('form-room-id').value,
        arrivalDate: document.getElementById('form-arrival-date').value,
        departureDate: document.getElementById('form-departure-date').value,
        numberOfGuests: parseInt(document.getElementById('form-guests').value),
        price: parseFloat(document.getElementById('form-total-price').value), // Total Price
        name: document.getElementById('guest-name').value,
        email: document.getElementById('guest-email').value
    };
    
    const submitButton = document.querySelector('#guest-details button');
    submitButton.innerText = 'Processing...';
    submitButton.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalPayload),
        });

        const data = await response.json();

        if (response.ok && data.bookingId) {
            
            alert(`Reservation successful! Your PENDING Booking ID is: ${data.bookingId}. 
            Total Amount: ₹${data.amount.toFixed(2)}. 
            \n(NOTE: This booking is PENDING in the database. The next real-world step is payment processing.)`);

            // Clean up UI after success
            document.getElementById('guest-details-form-section').remove();
            bookingForm.reset();
            bookingSection.scrollIntoView({ behavior: 'smooth' });
            
        } else {
            alert(`Reservation failed. Please try again. Error: ${data.message || 'Server did not return a valid booking ID.'}`);
        }
    } catch (error) {
        console.error('Final reservation error:', error);
        alert("A critical error occurred during reservation. Please check server status.");
    } finally {
        submitButton.innerText = 'Confirm Reservation & Pay';
        submitButton.disabled = false;
    }
};


// --- 8. EVENT LISTENERS ATTACHMENT ---

// Listener for the initial check availability form
bookingForm.addEventListener('submit', handleAvailabilityCheck);

// Listener for the dynamically created guest details form (uses event delegation for safety)
document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'guest-details') {
        handleFinalReservation(e);
    }
});