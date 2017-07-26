set -v

# Talk to the metadata server to get the project id
PROJECTID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")

# Install logging monitor. The monitor will automatically pickup logs sent to
# syslog.
curl -s "https://storage.googleapis.com/signals-agents/logging/google-fluentd-install.sh" | bash
service google-fluentd restart &

# Install dependencies from apt
apt-get update
apt-get install -yq \
    git build-essential supervisor python3 python3-dev python3-pip libffi-dev \
    libssl-dev

# Create a cheap-drone user. The application will run as this user.
useradd -m -d /home/cheap-drone cheap-drone

# pip from apt is out of date, so make it update itself and install virtualenv.
pip3 install --upgrade pip virtualenv

# Get the source code from the Google Cloud Repository
# git requires $HOME and it's not set during the startup script.
export HOME=/root
git config --global credential.helper gcloud.sh
git clone https://source.developers.google.com/p/excellent-tide-117005/r/CheapDrone /opt/app/CheapDrone

# Install app dependencies
virtualenv -p python3 /opt/app/CheapDrone/env
/opt/app/CheapDrone/env/bin/pip install -r /opt/app/CheapDrone/requirements.txt

# Make sure the cheap-drone user owns the application code
chown -R cheap-drone:cheap-drone /opt/app

# Configure supervisor to start gunicorn inside of our virtualenv and run the
# application.
cat >/etc/supervisor/conf.d/cheap-drone.conf << EOF
[program:cheap-drone]
directory=/opt/app/CheapDrone
command=/opt/app/CheapDrone/env/bin/python3 cheap-drone.py
autostart=true
autorestart=true
user=cheap-drone
# Environment variables ensure that the application runs inside of the
# configured virtualenv.
environment=VIRTUAL_ENV="/opt/app/env/CheapDrone",PATH="/opt/app/CheapDrone/env/bin",\
    HOME="/home/cheap-drone",USER="cheap-drone"
stdout_logfile=syslog
stderr_logfile=syslog
EOF

supervisorctl reread
supervisorctl update

# Application should now be running under supervisor