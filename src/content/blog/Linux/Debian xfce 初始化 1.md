---
tags:
  - "#apt"
  - "#linux-configuration"
  - "#package-management"
  - "#shell-scripting"
creation_date: 2025-04-22
---
自动登录
编辑/etc/lightdm/lightdm.conf
```bash
[Seat:*]
autologin-user=aabbcc
autologin-user-timeout=0

systemctl restart lightdm
```

rime
```bash
apt install --reinstall fcitx5 fcitx5-rime fcitx5-config-qt fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 fcitx5-frontend-qt5 fcitx5-frontend-qt6 fonts-noto-cjk
```
编辑 ~/.profile
```bash
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
```

Firefox-devedition
```bash
install -d -m 0755 /etc/apt/keyrings

wget -q https://packages.mozilla.org/apt/repo-signing-key.gpg -O- | sudo tee /etc/apt/keyrings/packages.mozilla.org.asc > /dev/null 

echo "deb [signed-by=/etc/apt/keyrings/packages.mozilla.org.asc] https://packages.mozilla.org/apt mozilla main" | sudo tee -a /etc/apt/sources.list.d/mozilla.list > /dev/null 

cat << EOF >| /etc/apt/preferences.d/mozilla
Package: *
Pin: origin packages.mozilla.org
Pin-Priority: 1000
EOF

apt update && apt install firefox-devedition

apt purge firefox-esr
```

sublime-text
```bash
wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/sublimehq-archive.gpg > /dev/null
echo "deb https://download.sublimetext.com/ apt/stable/" | sudo tee /etc/apt/sources.list.d/sublime-text.list
apt update && apt install sublime-text
```


wireguard_toggle
```bash
#!/bin/bash
# 定义 WireGuard 接口名称
WG_INTERFACE="wg0"
WG_SERVICE="wg-quick@${WG_INTERFACE}.service"
# 检查 WireGuard 服务状态
if systemctl is-active --quiet "${WG_SERVICE}"; then
    # 服务正在运行，执行停止操作
    echo "Stopping WireGuard ${WG_INTERFACE}..."
    sudo systemctl stop "${WG_SERVICE}"
    if [ $? -eq 0 ]; then
        echo "WireGuard ${WG_INTERFACE} stopped successfully."
    else
        echo "Failed to stop WireGuard ${WG_INTERFACE}."
    fi
else
    # 服务未运行，执行启动操作
    echo "Starting WireGuard ${WG_INTERFACE}..."
    sudo systemctl start "${WG_SERVICE}"
    if [ $? -eq 0 ]; then
        echo "WireGuard ${WG_INTERFACE} started successfully."
    else
        echo "Failed to start WireGuard ${WG_INTERFACE}. Check logs for details."
    fi
fi
```
启动命令，以便输密码
```bash
pkexec /path/to/your/wireguard_toggle.sh
```

