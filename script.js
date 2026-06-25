// ============================================================
//  PaddlePro — script.js  (Supabase-powered)
// ============================================================

const sb = supabase.createClient(
    'https://omrclbokfizzdliftfir.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcmNsYm9rZml6emRsaWZ0ZmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjkxNTQsImV4cCI6MjA5Nzk0NTE1NH0.t796NKWdB3XQA7JC14Whdg8QwiE3EnP62Vn72Qt8DVs'
);

// ── currently logged-in user (stored in memory) ──────────────
let currentUser = null;

// ============================================================
//  NAV / MENU
// ============================================================
function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}

// ============================================================
//  AUTH MODAL
// ============================================================
function showAuthModal(type) {
    document.getElementById('authModal').classList.remove('hidden');
    toggleAuthForm(type);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthForm(type) {
    if (type === 'login') {
        document.getElementById('loginFormBlock').classList.remove('hidden');
        document.getElementById('registerFormBlock').classList.add('hidden');
    } else {
        document.getElementById('loginFormBlock').classList.add('hidden');
        document.getElementById('registerFormBlock').classList.remove('hidden');
    }
}

// ============================================================
//  REGISTER
// ============================================================
async function handleRegister(e) {
    e.preventDefault();

    const name     = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    // Check if email already exists
    const { data: existing } = await sb
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existing) {
        alert('An account with this email already exists.');
        return;
    }

    const { data, error } = await sb
        .from('users')
        .insert([{ name, email, password, role: 'user' }])
        .select()
        .single();

    if (error) {
        alert('Registration failed: ' + error.message);
        return;
    }

    alert('Account created successfully! You can now log in.');
    toggleAuthForm('login');
}

// ============================================================
//  LOGIN
// ============================================================
async function handleLogin(e) {
    e.preventDefault();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const { data: user, error } = await sb
        .from('users')
        .select('id, name, email, role')
        .eq('email', email)
        .eq('password', password)
        .single();

    if (error || !user) {
        alert('Invalid email or password.');
        return;
    }

    currentUser = user;
    closeAuthModal();

    // BUG 1 FIXED: correct section ID is 'dashboards'
    document.getElementById('dashboards').classList.remove('hidden');

    // Update welcome name and email in dashboard header
    const nameEl  = document.getElementById('dashUserName');
    const emailEl = document.getElementById('dashUserEmail');
    if (nameEl)  nameEl.innerText  = user.name;
    if (emailEl) emailEl.innerText = user.email;

    alert(`Welcome back, ${user.name}!`);

    if (user.role === 'admin') {
        loadAdminDashboard();
    } else {
        loadUserDashboard();
    }
}

// ============================================================
//  LOGOUT
// ============================================================
function handleLogout() {
    currentUser = null;
    // BUG 1 FIXED: correct section ID is 'dashboards'
    document.getElementById('dashboards').classList.add('hidden');
    alert('You have been logged out.');
}

// ============================================================
//  BOOKING FORM HELPERS
// ============================================================
function selectCourt(id, price) {
    const courtSelect = document.getElementById('bookingCourt');
    courtSelect.value = id;
    calculateTotal();
}

function calculateTotal() {
    const courtSelect    = document.getElementById('bookingCourt');
    const selectedOption = courtSelect.options[courtSelect.selectedIndex];
    const rate           = parseFloat(selectedOption.getAttribute('data-price')) || 0;
    const slotCount      = Math.max(document.getElementById('bookingTime').selectedOptions.length, 1);
    const finalTotal     = rate * slotCount;

    document.getElementById('summaryRate').innerText  = `PKR ${rate.toLocaleString()}`;
    document.getElementById('summaryTotal').innerText = `PKR ${finalTotal.toLocaleString()}`;
}

function toggleGatewayFields(mode) {
    if (mode === 'card') {
        document.getElementById('cardFields').classList.remove('hidden');
        document.getElementById('mobileFields').classList.add('hidden');
    } else {
        document.getElementById('cardFields').classList.add('hidden');
        document.getElementById('mobileFields').classList.remove('hidden');
    }
}

// ============================================================
//  SUBMIT BOOKING
// ============================================================
document.getElementById('bookingForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!currentUser) {
        alert('Please log in first to make a booking.');
        showAuthModal('login');
        return;
    }

    const courtSelect    = document.getElementById('bookingCourt');
    const selectedOption = courtSelect.options[courtSelect.selectedIndex];
    const court_id       = parseInt(courtSelect.value);
    const rate           = parseFloat(selectedOption.getAttribute('data-price')) || 0;

    const booking_date   = document.getElementById('bookingDate').value;
    const time_slot      = document.getElementById('bookingTime').value;
    const duration       = parseInt(document.getElementById('bookingPlayers')?.value) || 1;
    const players        = parseInt(document.getElementById('bookingPlayers')?.value) || 1;
    const total_price    = rate * Math.max(document.getElementById('bookingTime').selectedOptions.length, 1);
    const payment_method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Card';

    if (!booking_date || !time_slot || !court_id) {
        alert('Please fill in all booking details.');
        return;
    }

    // Check for slot clash
    const { data: clash } = await sb
        .from('bookings')
        .select('id')
        .eq('court_id', court_id)
        .eq('booking_date', booking_date)
        .eq('time_slot', time_slot)
        .eq('status', 'Confirmed');

    if (clash && clash.length > 0) {
        alert('This time slot is already booked. Please choose another.');
        return;
    }

    // Insert booking
    const { data: booking, error: bookingError } = await sb
        .from('bookings')
        .insert([{ user_id: currentUser.id, court_id, booking_date, time_slot, duration, players, total_price }])
        .select()
        .single();

    if (bookingError) {
        alert('Booking failed: ' + bookingError.message);
        return;
    }

    // Insert payment record
    const mockTxnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const { error: paymentError } = await sb
        .from('payments')
        .insert([{
            booking_id:     booking.id,
            amount:         total_price,
            method:         payment_method,
            status:         'Success',
            transaction_id: mockTxnId
        }]);

    if (paymentError) {
        alert('Booking saved but payment record failed: ' + paymentError.message);
        return;
    }

    alert(`Booking confirmed! ✅\nBooking ID: #${booking.id}\nTransaction ID: ${mockTxnId}`);
    this.reset();
    calculateTotal();
    loadUserDashboard();
});

// ============================================================
//  DASHBOARD TABS
// ============================================================
function switchDashboard(targetId) {
    document.getElementById('userDash').classList.add('hidden');
    document.getElementById('adminDash').classList.add('hidden');

    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));

    document.getElementById(targetId).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

// ============================================================
//  USER DASHBOARD — load their bookings
// ============================================================
async function loadUserDashboard() {
    if (!currentUser) return;

    const { data: bookings, error } = await sb
        .from('bookings')
        .select('*, courts(name)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to load bookings:', error.message);
        return;
    }

    const tbody = document.getElementById('userBookingsTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No bookings yet.</td></tr>';
        return;
    }

    bookings.forEach(b => {
        tbody.innerHTML += `
            <tr>
                <td>#${b.id}</td>
                <td>${b.courts?.name || 'N/A'}</td>
                <td>${b.booking_date} — ${b.time_slot}</td>
                <td>PKR ${parseFloat(b.total_price).toLocaleString()}</td>
                <td><span class="badge-success">${b.status}</span></td>
                <td>
                    <button class="btn-action cancel" onclick="cancelBooking(${b.id})">Cancel</button>
                    <button class="btn-action download" onclick="triggerReceiptDownload(${b.id})"><i class="fas fa-download"></i></button>
                </td>
            </tr>`;
    });
}

// ============================================================
//  ADMIN DASHBOARD — load all bookings
// ============================================================
async function loadAdminDashboard() {
    const { data: bookings, error } = await sb
        .from('bookings')
        .select('*, users(name), courts(name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to load admin bookings:', error.message);
        return;
    }

    const tbody = document.getElementById('adminBookingsTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No bookings found.</td></tr>';
        return;
    }

    // BUG 2 FIXED: correct IDs match index.html
    const totalEl   = document.getElementById('adminTotalBookings');
    const revenueEl = document.getElementById('adminTotalRevenue');
    if (totalEl)   totalEl.innerText   = bookings.length;
    if (revenueEl) revenueEl.innerText = 'PKR ' + bookings.reduce((s, b) => s + parseFloat(b.total_price), 0).toLocaleString();

    bookings.forEach(b => {
        tbody.innerHTML += `
            <tr>
                <td>#${b.id}</td>
                <td>${b.users?.name || 'N/A'}</td>
                <td>${b.courts?.name || 'N/A'}</td>
                <td>${b.booking_date} — ${b.time_slot}</td>
                <td>PKR ${parseFloat(b.total_price).toLocaleString()}</td>
                <td><span class="badge-success">${b.status}</span></td>
            </tr>`;
    });
}

// ============================================================
//  CANCEL BOOKING
// ============================================================
async function cancelBooking(id) {
    if (!confirm(`Cancel booking #${id}?`)) return;

    const { error } = await sb
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', id);

    if (error) {
        alert('Failed to cancel: ' + error.message);
        return;
    }

    alert(`Booking #${id} cancelled.`);
    loadUserDashboard();
}

// ============================================================
//  RECEIPT (mock)
// ============================================================
function triggerReceiptDownload(id) {
    alert(`Downloading receipt for Booking #${id}`);
}

// ============================================================
//  PAGE LOAD
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    calculateTotal();

    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min   = today;
    }

    // Wire up auth forms
    const registerForm = document.getElementById('registerForm');
    const loginForm    = document.getElementById('loginForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (loginForm)    loginForm.addEventListener('submit', handleLogin);
});
