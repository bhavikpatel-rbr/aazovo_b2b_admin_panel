```jsx
import Menu from '@/components/ui/Menu'

const DisabledMenuItem = () => {
    return (
        <div
            className="border border-gray-200 dark:border-gray-700 rounded-md p-2"
            style={{ maxWidth: 250 }}>
            <Menu>
                <Menu.MenuItem eventKey="settings">Settings</Menu.MenuItem>
                <Menu.MenuItem eventKey="message" disabled>
                    Message
                </Menu.MenuItem>
                <Menu.MenuItem eventKey="gallery">Gallery</Menu.MenuItem>
            </Menu>
        </div>
    );
}

export default DisabledMenuItem
```