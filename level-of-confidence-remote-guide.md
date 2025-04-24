# Global Level of Confidence - How to Connect to the Remote Server

**Icelandic server hosted by**: https://flokinet.is/  
**URLs**:  
- Prod: https://levelofconfidence.net, https://niveldeconfianza.net  
- DEV: https://des445dev.levelofconfidence.net
- 2nd DEV: https://sandbx.niveldeconfianza.net, https://sandbx.levelofconfidence.net  

---

## Step 1: Install WSL or Cygwin (only necessary on Windows)

### Option A (Recommended): Install WSL
```bash
wsl --install
```
- Open PowerShell as Administrator
- Restart computer when prompted
- Set up a Linux username and password

### Option B: Install Cygwin
- Go to [https://www.cygwin.com/](https://www.cygwin.com/)
- Download and run `setup-x86_64.exe`
- Include these packages:
  - `openssh`
  - `git` (optional)

> On **Mac**, you don’t need WSL or Cygwin – SSH is built-in.

---

## Step 2: Create `.ssh` folder and SSH key

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

> Store your passphrase in [https://keepass.info/](https://keepass.info/) for safety.

---

## Step 3: Send Your Public Key to the Sysadmin

```bash
cat ~/.ssh/gloc.pub
```

Send the output to Saralin or Julian. To add it on server:

```bash
nano ~/.ssh/authorized_keys
```

---

## Step 4: Start SSH Agent

```bash
ssh-agent bash
ssh-add ~/.ssh/gloc
```

---

## Step 5: Connect to Server

```bash
ssh -p 51679 sitedev@185.165.170.107
ssh -p 51679 -i ~/.ssh/GLOC sitedev@185.165.170.107
```

---

## From Now On

```bash
cd ~/.ssh
ssh-agent bash
ssh-add gloc
ssh -p 51679 sitedev@185.165.170.107
```

---

## To Upload Files

```bash
rsync -e "ssh -p 51679" -avz [local-folder-path] sitedev@185.165.170.107:site/[destination-folder-name]
```

---

## Server Structure

When SSH’d into `/home/sitedev`:

- `scripts/` – Shell scripts for deploy/start
- `site/` – Server code (`newGloc`)

### Use `screen` for safety

```bash
screen -list
screen -r [id]
screen
exit  # to kill
Ctrl + A, then Ctrl + D  # to detach
```

---

## Update and Start Server

```bash
screen -r
cd site/newGloc
git pull
./deploy.sh
Ctrl + A, then Ctrl + D

# Start
screen -r
./start.sh
Ctrl + A, then Ctrl + D
```

> ⚠️ Don’t disconnect before detaching – it kills the screen.

---

## Block IP Address

```bash
iptables -I INPUT -j DROP -p tcp -s /[IP ADDRESS]
```

---

## Manual Backend Deployment

```bash
cp -a /data/gloc/gloc-be /home/sitedev/levelofconfidence_be_$(date +%d-%m-%y)
screen -r
# CTRL+C to stop server

cp -a /home/sitedev/repo/<backend tree> /data/gloc/
/data/gloc/prep.sh
chown -R sitedev:www-data /data/gloc/
screen -r
node server
```

---

## Manual Frontend Deployment

```bash
cp -a /var/www/html/levelofconfidence.net /home/sitedev/levelofconfidence_fe_$(date +%d-%m-%y)

# Look at old files:
ls -l /var/www/html/levelofconfidence.net

# Copy new files
cp -a /home/sitedev/repo/<frontend tree> /var/www/html/levelofconfidence.net/

# Set permissions
chown -R sitedev:www-data /var/www/html/levelofconfidence.net
```