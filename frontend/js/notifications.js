class Notifications {
    static show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-close">&times;</span>
            <div>${message}</div>
        `;

        document.getElementById('notifications').appendChild(notification);

        // Auto remove after 4 seconds
        const autoRemove = setTimeout(() => {
            notification.remove();
        }, 4000);

        // Manual remove on click
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.remove();
        });
    }
}