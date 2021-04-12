const { User } = require("../../models");

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
const should = chai.should();

chai.use(chaiHttp);

describe("🔥PATCH /sign/in", () => {
  const email = "test@test.com",
    nickname = "yubin-j",
    password = 1234;
  let accessToken;

  before(async () => {
    await User.destroy({
      where: {},
    });
    await User.create({
      email,
      nickname,
      password,
    });
  });
  it("check email required", (done) => {
    const req = {
      email: "",
      password,
    };
    chai
      .request(server)
      .patch("/sign/in")
      .send(req)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property("message").eql("Insufficient info");
        done();
      });
  });
  it("check password required", (done) => {
    const req = {
      email,
      password: "",
    };
    chai
      .request(server)
      .patch("/sign/in")
      .send(req)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property("message").eql("Insufficient info");
        done();
      });
  });
  it("check successfully sign in", (done) => {
    const req = {
      email,
      password,
    };
    chai
      .request(server)
      .patch("/sign/in")
      .send(req)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("accessToken");
        accessToken = res.body.accessToken;
        done();
      });
  });
  it("compare access token from request with db", (done) => {
    User.findOne({
      where: { email },
      raw: true,
    }).then((userInfo) => {
      userInfo.latestToken.should.eql(accessToken);
      done();
    });
  });
  it("check ignore incorrect password", (done) => {
    const req = {
      email,
      password: "failed",
    };
    chai
      .request(server)
      .patch("/sign/in")
      .send(req)
      .end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property("message").eql("Wrong password");
        res.body.should.not.have.property("accessToken");
        done();
      });
  });
  it("check ignore none exists user", (done) => {
    const req = {
      email: "not@test.com",
      password,
    };
    chai
      .request(server)
      .patch("/sign/in")
      .send(req)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property("message").eql("None exists user");
        res.body.should.not.have.property("accessToken");
        done();
      });
  });
});