# Global Level of Confidence - How to Connect to the Remote Server

**Icelandic server hosted by**: https://flokinet.is/  
**Url**: https://levelofconfidence.net/, https://niveldeconfianza.net  
**DEV url**: https://des445dev.levelofconfidence.net, https://niveldeconfianza.net  
**2nd DEV url**: https://sandbx.niveldeconfianza.net, https://sandbx.levelofconfidence.net  

---

## Step 1: Install WSL or Cygwin (only necessary on Windows)

Since the remote server runs Linux, we need a Linux-like environment to interact with it. This allows you to use Unix-style commands like ssh, scp, and chmod.

**Option A (Recommended): Install WSL (Windows Subsystem for Linux)**  
- Open PowerShell as Administrator  
- Run:  
  ```bash
  wsl --install
  ```  
- Restart your computer when prompted  
- After reboot, set up a Linux username and password when prompted  

**Option B: Install Cygwin**  
- Go to https://www.cygwin.com/  
- Download and run `setup-x86_64.exe`  
- During installation, make sure to include the following packages:  
  - `openssh`  
  - `git` (optional)  

On Mac, you don’t need WSL or Cygwin, because macOS is already Unix-based and has SSH built in.

---

## Step 2: Create your .ssh folder and SSH key

To connect to the remote server, you'll need to generate an SSH key pair. Your public key needs to be added to the server. Check if you already have a `.ssh` dir, if so, `cd` into it.  
If not:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

When prompted, enter a passphrase. Store this in https://keepass.info/ for extra security. 

---

## Step 3: Send your public key to the sysadmin

Show your public key:

```bash
cat ~/.ssh/gloc.pub
```

Copy the full output and send it to the system administrator (Saralin or Julian) so they can add it to the server. (`cd #HOME/.ssh` or `cd ~/.ssh`, `vim` or `nano authorized_keys`, add to line below).  

`vim` is difficult to work with:

```bash
vim authorized_keys
```

`nano` would be easier:

```bash
nano authorized_keys
```

---

## Step 4: Start the SSH agent

In the same terminal, run:

```bash
ssh-agent bash
ssh-add ~/.ssh/gloc
```

It will prompt you to enter the passphrase you just set here.

---

## Step 5: Connect to the server

Run this command:

```bash
ssh -p 51679 sitedev@185.165.170.107
ssh -p 51679 -i ~/.ssh/GLOC sitedev@185.165.170.107
```

---

From now on, just navigate (`cd`) to the directory containing your `.ssh` key, run `ssh-agent bash`, then `ssh-add gloc`. Enter your passphrase when prompted, and then SSH into the server:

```bash
ssh -p 51679 sitedev@185.165.170.107
```

---

## TO UPLOAD FILES TO THE SERVER

In terminal (not attached to the server):

```bash
rsync -e "ssh -p 51679" -avz [local-folder-path] sitedev@185.165.170.107:site/[destination-folder-name]
```

Replace `[local-folder-path]` with the folder you want to upload, and `[destination-folder-name]` with the folder name on the server.

---

## SERVER STRUCTURE & USAGE NOTES

When you SSH into the server, you’ll land in `/home/sitedev`. This directory contains two main folders:

### 1. scripts/  
Contains shell scripts to start and deploy the server.  

### 2. site/  
Contains server code. Currently pulls from the `newGloc` directory.

It’s important to understand how to use screen before running any scripts.  
If you start the server without using a screen session and then close the terminal or disconnect, the server will stop running.

```bash
# List active sessions:
screen -list

# Reattach to an existing session:
screen -r [screen-id]

# Start and attach to a new screen session:
screen

# Kill a session:
exit

# Detach from a screen session:
Ctrl + A, then Ctrl + D
```

Disconnect from the server (when not attached to a screen):  
**Ctrl + A, then Ctrl + D**

Update and start the server (after pushing most recent changes):  

```bash
# Attach to a screen session
cd site/newGloc
git pull
./deploy.sh
Ctrl + A, then Ctrl + D (detach the screen session)

# Start the server
Attach to a screen session
./start.sh
Ctrl + A, then Ctrl + D (detach the screen session)
```

⚠️ **Important**:  
If you disconnect from the server (e.g. by pressing Ctrl + D or closing the terminal) before detaching the screen session, it will terminate the session and stop the server if it's running inside it.

---

## Other:

Block IP address (may need to use a different command, depending on system):

```bash
iptables -I INPUT -j DROP -p tcp -s [IP ADDRESS]
```

---

## Deploy backend (manually):

```bash
# backup the existing working tree, including the database
cp -a /data/gloc/gloc-be /home/sitedev/levelofconfidence_be_$(date +%d-%m-%y)

# stop node server
screen -r 
CTRL-c 

# detach from that screen

# take a look at the existing folder so you know what you're copying in:
ls -l /data/gloc/gloc-be

# copy in your updated backend
cp -a /home/sitedev/repo/<backend tree> /data/gloc/

# make sure all dependencies are installed:
/data/gloc/prep.sh

# set permissions
chown -R sitedev:www-data /data/gloc/

# resume the screen session
screen -r 

# start node in this screen
node server

# detach from screen
```

---

## Deploy frontend (manually):

```bash
# create a folder called `repo`, `git clone` to it or `scp` in your local repo to it. 

# backup the existing working site tree
cp -a /var/www/html/levelofconfidence.net /home/sitedev/levelofconfidence_fe_$(date +%d-%m-%y)

# take a look at the existing front end web root:
ls -l /var/www/html/levelofconfidence.net

# this returns at the present time:
drwxr-xr-x 2 sitedev www-data 4096 Feb 26 15:56 assets
drwxrwxr-x 2 sitedev www-data 4096 Apr 15 07:47 dist
drwxr-xr-x 2 sitedev www-data 4096 Feb  3 17:15 fonts
-rw-r--r-- 1 sitedev www-data 1221 Feb 26 15:56 index.html
drwxr-xr-x 4 sitedev www-data 4096 Apr 15 07:46 internal_cdn
-rw-r--r-- 1 sitedev www-data 1497 Jan 26 23:07 vite.svg

# copy your changes from your front end repo code to the live front end web root:
cp -a  /home/sitedev/repo/<frontend tree> /var/www/html/levelofconfidence.net/

# set permissions:
chown -R sitedev:www-data /var/www/html/levelofconfidence.net
```