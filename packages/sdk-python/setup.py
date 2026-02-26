from setuptools import setup, find_packages

setup(
    name="cashapi-sdk",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "bitcash>=0.6.8",
        "requests>=2.25.1",
    ],
    author="CashApi Team",
    description="Python SDK for CashApi (BCH 402)",
    classifiers=[
        "Programming Language :: Python :: 3.8",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.8',
)
