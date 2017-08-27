# Alexa Skill "Kumon English"

Example Alexa Skill to study Kumon English phrases. This skill is intended to used only for my daughter's daily English practice.

## Environment

Use Vagrant. Move to env directory, then hit `vagrant up`. After the provisioning, login to the environment by `vagraht ssh`.

```bash
$ pwd
/path/to/env
$ vagrant up
$ vagrant ssh
```

Required utilities have already been installed.

```bash
# in Vagrant
$ sls --version
1.20.0
$ node -v
v6.10.0
$ python -V
Python 3.5.2
$ aws --version
aws-cli/1.11.141 Python/3.5.2 Linux/2.6.32-431.3.1.el6.x86_64 botocore/1.6.8
```

Configure aws credentials and region. You need to specify us-east-1 for region.

```bash
# in Vagrant
$ aws configure # ensure specifying region -> us-east-1
```

Please ensure you can use serverless commands.

```bash
# in Vagrant
$ sls help
$ sls create --help
```

Move to kumon directory and install dependencies.

```bash
# in Vagrant
$ pwd
/path/to/kumon
$ yarn
```

## Deploy

Deploy lambda function by `sls deploy`.

```bash
# in Vagrant
$ pwd
/path/to/kumon
$ sls deploy
```

## Alexa Skill setting

Create a Skill on developer portal.

[Building Alexa Skills with the Alexa Skills Kit](https://developer.amazon.com/edw/home.html#/skills)

As for `Interaction Model`. Copy the settings from [sppechAssets](./kumon/speechAssets). Detailed instructions are available on [Alexa Github](https://github.com/alexa). For example, [howto](https://github.com/alexa/skill-sample-nodejs-howto) repo has good step by step guide.

## Test

You can test the skill by text input instead of voice on developer portal. Also, you can test it by voice on [Echosim.io](https://echosim.io/).
