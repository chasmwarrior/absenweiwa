#!/bin/bash

# Configuration
APP_NAME="absensibot"
START_CMD="npm run build && pm2 start dist/server.cjs --name $APP_NAME"
DB_FILE="local.db"
BACKUP_DIR="backup_data"

# Ensure pm2 is available
if ! command -v pm2 &> /dev/null
then
    echo "PM2 not found. Please install globally via: npm install -g pm2"
fi

show_menu() {
    clear
    echo "=========================================="
    echo "        AbsensiBot Manager Menu           "
    echo "=========================================="
    echo "1. Clone GitHub Repository"
    echo "2. Fresh Install (New Installation)"
    echo "3. Reinstall (Clean Install)"
    echo "4. Reinstall (Clean + Backup & Restore Data)"
    echo "5. Update & Reinstall (Pull Latest + Backup & Restore Data)"
    echo "6. Monitoring (Logs, Debug, Trace)"
    echo "7. Service Management (Start, Restart, Stop)"
    echo "8. Exit"
    echo "=========================================="
    read -p "Select an option (1-8): " choice
    handle_choice "$choice"
}

pause() {
    read -p "Press [Enter] key to continue..."
}

clone_repo() {
    read -p "Enter GitHub Repository URL: " repo_url
    if [ -z "$repo_url" ]; then
        echo "URL cannot be empty."
        pause
        return
    fi

    echo "Fetching available branches..."
    branches=$(git ls-remote --heads "$repo_url" | awk -F'refs/heads/' '{print $2}')
    if [ -z "$branches" ]; then
        echo "Failed to fetch branches or no branches available."
        pause
        return
    fi

    echo "Available branches:"
    select branch in $branches; do
        if [ -n "$branch" ]; then
            break
        fi
    done

    read -p "Clone to a new custom folder? (y/n): " custom_folder_opt
    if [[ "$custom_folder_opt" =~ ^[Yy]$ ]]; then
        read -p "Enter folder name: " folder_name
        git clone -b "$branch" "$repo_url" "$folder_name"
    else
        git clone -b "$branch" "$repo_url"
    fi

    echo "Cloning complete."
    pause
}

perform_install() {
    echo "Installing dependencies..."
    npm install

    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
    fi

    echo "Running database push..."
    npm run db:push

    echo "Building application..."
    npm run build

    echo "Starting PM2 service..."
    pm2 delete "$APP_NAME" 2>/dev/null || true
    pm2 start dist/server.cjs --name "$APP_NAME"
    pm2 save

    echo "Installation complete and service started in background."
}

backup_data() {
    echo "Backing up database..."
    mkdir -p "$BACKUP_DIR"
    if [ -f "$DB_FILE" ]; then
        cp "$DB_FILE" "$BACKUP_DIR/$DB_FILE"
        echo "Backup successful."
    else
        echo "No database file found to backup."
    fi
}

restore_data() {
    echo "Restoring database..."
    if [ -f "$BACKUP_DIR/$DB_FILE" ]; then
        cp "$BACKUP_DIR/$DB_FILE" "$DB_FILE"
        echo "Restore successful."
    else
        echo "No backup file found to restore."
    fi
}

clean_install() {
    echo "Cleaning up existing installation..."
    pm2 delete "$APP_NAME" 2>/dev/null || true
    rm -rf node_modules
    rm -rf dist
}

reinstall_clean() {
    clean_install
    rm -f "$DB_FILE"
    perform_install
    pause
}

reinstall_backup() {
    backup_data
    clean_install
    rm -f "$DB_FILE"
    perform_install
    restore_data
    pm2 restart "$APP_NAME"
    pause
}

update_reinstall() {
    echo "Updating latest changes from Git..."
    GIT_COMMAND="git pull origin HEAD --rebase=false"
    eval "$GIT_COMMAND"
    backup_data
    clean_install
    rm -f "$DB_FILE"
    perform_install
    restore_data
    pm2 restart "$APP_NAME"
    pause
}

monitoring_menu() {
    clear
    echo "=========================================="
    echo "            Monitoring Menu               "
    echo "=========================================="
    echo "1. View Live PM2 Logs"
    echo "2. View Application Debug Log (debug.log)"
    echo "3. Restart Application"
    echo "4. Stop Application"
    echo "5. Return to Main Menu"
    echo "=========================================="
    read -p "Select an option (1-5): " mon_choice

    case $mon_choice in
        1) pm2 logs "$APP_NAME" ;;
        2)
           if [ -f "debug.log" ]; then
               cat debug.log | tail -n 100
           else
               echo "debug.log not found."
           fi
           pause
           ;;
        3) pm2 restart "$APP_NAME"; pause ;;
        4) pm2 stop "$APP_NAME"; pause ;;
        5) return ;;
        *) echo "Invalid option."; pause ;;
    esac
}

service_menu() {
    clear
    echo "=========================================="
    echo "         Service Management Menu          "
    echo "=========================================="
    echo "1. Start Service"
    echo "2. Restart Service"
    echo "3. Stop Service"
    echo "4. Return to Main Menu"
    echo "=========================================="
    read -p "Select an option (1-4): " srv_choice

    case $srv_choice in
        1) pm2 start "$APP_NAME" || pm2 start dist/server.cjs --name "$APP_NAME"; pause ;;
        2) pm2 restart "$APP_NAME"; pause ;;
        3) pm2 stop "$APP_NAME"; pause ;;
        4) return ;;
        *) echo "Invalid option."; pause ;;
    esac
}

handle_choice() {
    case $1 in
        1) clone_repo ;;
        2) perform_install; pause ;;
        3) reinstall_clean ;;
        4) reinstall_backup ;;
        5) update_reinstall ;;
        6) monitoring_menu ;;
        7) service_menu ;;
        8) exit 0 ;;
        *) echo "Invalid option."; pause ;;
    esac
}

while true; do
    show_menu
done
