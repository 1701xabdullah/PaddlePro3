function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

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

function selectCourt(id, price) {
    const courtSelect = document.getElementById('bookingCourt');
    courtSelect.value = id;
    calculateTotal();
}

function calculateTotal() {
    const courtSelect = document.getElementById('bookingCourt');
    const selectedOption = courtSelect.options[courtSelect.selectedIndex];
    const rate = parseFloat(selectedOption.getAttribute('data-price')) || 0;
    
    const slotCount = Math.max(document.getElementById('bookingTime').selectedOptions.length,1);
    const finalTotal = rate * slotCount;
    
    document.getElementById('summaryRate').innerText = `PKR ${rate.toLocaleString()}`;
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

function switchDashboard(targetId) {
    document.getElementById('userDash').classList.add('hidden');
    document.getElementById('adminDash').classList.add('hidden');
    
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    
    document.getElementById(targetId).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Processing transaction via fake secure gateway verification layer... Click OK to complete.');
    alert('SUCCESS! Transaction authorization completed. Receipt generated inside active matrix user logs.');
});

function cancelBookingAction(id) {
    if(confirm(`Are you absolutely sure you want to release slot reservation #${id}?`)) {
        alert('Reservation canceled successfully.');
    }
}

function triggerReceiptDownload(id) {
    alert(`Downloading standardized PDF invoice layout structure for Booking sequence ID #${id}`);
}

window.addEventListener('DOMContentLoaded', () => {
    calculateTotal();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').value = today;
    document.getElementById('bookingDate').min = today;
});
