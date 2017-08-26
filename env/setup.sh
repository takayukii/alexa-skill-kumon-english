yum install -y git

# pyenv（Python）をインストールします
yum install -y git gcc gcc-c++ make git patch openssl-devel zlib-devel readline-devel sqlite-devel bzip2-devel
git clone https://github.com/yyuu/pyenv.git /usr/local/src/pyenv
echo 'export PYENV_ROOT="/usr/local/src/pyenv"' > /etc/profile.d/pyenv.sh
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> /etc/profile.d/pyenv.sh
echo 'eval "$(pyenv init -)"' >> /etc/profile.d/pyenv.sh
source /etc/profile.d/pyenv.sh
if [ ! -d "/usr/local/src/nvm/versions/node/v6.10.0" ]; then
	pyenv install 3.5.2
	pyenv global 3.5.2
fi

# pipをアップグレードします
pip install --upgrade pip

# nvm（Node.js）をインストールします
git clone git://github.com/creationix/nvm.git /usr/local/src//nvm
echo "source /usr/local/src/nvm/nvm.sh" > /etc/profile.d/nvm.sh
echo "nvm use v6.10.0 >/dev/null 2>&1" >> /etc/profile.d/nvm.sh
chmod 644 /etc/profile.d/nvm.sh
if [ ! -d "/usr/local/src/nvm/alias" ]; then
	mkdir /usr/local/src/nvm/alias
fi
if [ ! -d "/usr/local/src/nvm/versions/node/v6.10.0" ]; then
	source /usr/local/src/nvm/nvm.sh
	nvm install v6.10.0
	nvm global v6.10.0
fi
source /usr/local/src/nvm/nvm.sh

# AWS CLIをインストールします
pip install --upgrade awscli

# serverlessコマンドをインストールします
npm install -g serverless@1.20.0

# yarnをインストールします
npm install -g yarn

# NPMパッケージをインストールします
MYPATH=`pwd`
cd /share/serverless-services
yarn install
cd $MYPATH
