import { ethers } from "hardhat";
import "ethereum-cryptography/utils";
import { BigNumber} from "ethers";
import { utf8ToBytes } from "ethereum-cryptography/utils";
// import {_abi} from "typechain-types/factories/contracts/School__factory";

async function main() {
  // const lockedAmount = ethers.utils.parseEther("1");
  const [school, teacher, student] = await ethers.getSigners();

  const Contract = await ethers.getContractFactory("School");
  const contract = await Contract.deploy();

  const CertificateContract = await ethers.getContractFactory("Certificate");
  const certificateContract = await CertificateContract.attach(await contract.certificateContract());

  const QTKNContract = await ethers.getContractFactory("tokenQTKN");
  const qtknContract = await QTKNContract.attach(await contract.qtknContract());

  const CourseNFTContract = await ethers.getContractFactory("CourseNFT");
  const courseNftContract = await CourseNFTContract.attach(await contract.cnft());

  const PTKNContract = await ethers.getContractFactory("proxyTKN");
  const ptknContract = await PTKNContract.attach(await contract.ptknContract());

  await contract.deployed();

  console.log(`School: ${contract.address}\nCertificate Contract: ${certificateContract.address}\nQTKN Contract: ${qtknContract.address}\nCourse NFT: ${courseNftContract.address}\nPTKN Contract: ${ptknContract.address}`);

  console.log("\n***********************************************************************\n");
  /**
   * data comes from front end, it gets concatenated, turned to bytes string
   * eg: 1 ICS 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4 50000000000000000000 10 56500000000000000000 6500000000000000000
   * courseid, course name, teacher addr, teacher's price, share term, course price, school price (course price - teacher's price)
   */
  const CName = "ICS"
  const shareTerm = 10
  const BasePrice = 50
  const basePrice = ethers.utils.parseEther(BasePrice.toFixed(18));
  // const a = await contract.calculatePrice(price, shareTerm)
  // const b = await contract.calculateTaxPrice(price)
  // const c = await contract.calculateSharePrice(price, shareTerm)
  // const teachersPrice = addBigNumbers(a, b, c);
  const coursePrice = await contract.calculatePrice(basePrice, shareTerm)
  const str = `${(await courseNftContract.tokenCounter()).toNumber() + 1} ${CName} ${teacher.address} ${basePrice} ${shareTerm} ${coursePrice}  ${subBigNumbers(coursePrice, basePrice)}`
  console.log(str);
  const tx1 = await (await contract.createCourse(CName, teacher.address, BasePrice, shareTerm, str)).wait()
  console.log(tx1.events?.at(-1)?.args);
  console.log("Teacher creates course");

  console.log("\n***********************************************************************\n");
  const tx2 = await (await contract.connect(student).mint(100, {value: ethers.utils.parseEther("1")})).wait()
  // console.log(tx2.events);
  console.log(`Balance of student: ${await qtknContract.balanceOf(student.address)}`);
  console.log("Student buys tokens");

  console.log("\n***********************************************************************\n");
  const tx3 = await (await contract.connect(student).enroll(1)).wait()
  console.log(tx3.events?.at(-1)?.args);
  console.log("Student enrolls");

  console.log("\n***********************************************************************\n");
  // const tx4 = (await qtknContract.balanceOf(teacher.address))
  console.log(`Teacher got ${await qtknContract.balanceOf(teacher.address)} tokens and his base fee was ${basePrice}`);
  // console.log(tx4.events);
  console.log("teacher gets its fee");

  console.log("\n***********************************************************************\n");
  // const tx5 = await (await qtknContract.balanceOf(school.address)).wait()
  console.log(`School got ${await qtknContract.balanceOf(school.address)} tokens and his fee was ${subBigNumbers(coursePrice, basePrice)}`);
  // console.log(tx5.events);
  console.log("school gets its fee");

  console.log("\n***********************************************************************\n");
  const tx6 = await (await contract.connect(teacher).graduate(1, 1, student.address)).wait()
  console.log(tx6.events);
  console.log("Student graduates");

  console.log("\n***********************************************************************\n");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//// console.log(await tx1.events?.at(0)?.getTransactionReceipt());
  //// let events = await contract.queryFilter('newCourse', currentBlock - 10000, currentBlock);
    //// const data = utf8ToBytes(str);

function addBigNumbers(a: BigNumber, b: BigNumber, c: BigNumber): BigNumber {
  if (a == null || a.isZero() || b == null || b.isZero() || c == null || c.isZero()) {
      return BigNumber.from(0);
  }

  const aFloat = parseFloat(ethers.utils.formatEther(a));
  const bFloat = parseFloat(ethers.utils.formatEther(b));
  const cFloat = parseFloat(ethers.utils.formatEther(c));

  if (isNaN(aFloat) || isNaN(bFloat) || isNaN(cFloat)) {
      return BigNumber.from(0);
  }

  const resultFloat = aFloat  + bFloat + cFloat;

  return ethers.utils.parseEther(resultFloat.toFixed(18));
}

function subBigNumbers(a: BigNumber, b: BigNumber): BigNumber {
  if (a == null || a.isZero() || b == null || b.isZero()) {
      return BigNumber.from(0);
  }

  const aFloat = parseFloat(ethers.utils.formatEther(a));
  const bFloat = parseFloat(ethers.utils.formatEther(b));

  if (isNaN(aFloat) || isNaN(bFloat)) {
      return BigNumber.from(0);
  }

  const resultFloat = aFloat - bFloat;

  return ethers.utils.parseEther(resultFloat.toFixed(18));
}