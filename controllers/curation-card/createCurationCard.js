const { Curation, CurationCard, sequelize } = require("../../models");
const checkNumberType = require("../util/checkNumberType");

module.exports = async (req, res) => {
  const { authData } = req;
  if (!authData.isAdmin) {
    return res.status(403).send();
  }

  const { curationId, theme, title, detail, photo } = req.body;
  if (
    checkNumberType("required", curationId) ||
    checkNumberType("required", theme) ||
    !title ||
    !detail ||
    !photo
  ) {
    return res.status(400).json({ message: "Insufficient info" });
  }

  function errorMessage(code, message) {
    this.code = code;
    this.message = message;
  }

  try {
    await sequelize.transaction(async (t) => {
      //SELECT * FROM Curations WHERE id=1 AND NOT 4 MEMBER OF(themeInfo)
      // const curation = await Curation.findOne({
      //   where: {
      //     [Sequelize.Op.and]: [
      //       { id: curationId },
      //       Sequelize.fn(`${theme} MEMBER OF`, Sequelize.col("themeInfo")),
      //     ],
      //   },
      //   transaction: t,
      // });
      //curation이 이미 존재하고 있는지 확인, 없다면 400반환
      const curation = await Curation.findOne({
        where: { id: curationId },
        transaction: t,
      });
      if (!curation) {
        throw new errorMessage(404, "There is no data with given curation id");
      }

      //curation의 themeInfo가 배열이 아니었다면 빈배열로 초기화. 배열이었다면 theme이 기등록된 정보인지 확인.
      if (!Array.isArray(curation.themeInfo)) curation.themeInfo = [];
      else {
        //curation에 이미 등록된 theme 정보인지 확인, 이미 등록되어 있다면 409반환
        let isExists = false;
        for (const el of curation.themeInfo) {
          if (el === theme) {
            isExists = true;
            break;
          }
        }
        if (isExists) {
          throw new errorMessage(409, "Already exists theme");
        }
      }

      //자식이 변경되는 경우에는 save옵션을 사용해도 무시하기 떄문에 새로 할당
      //https://sequelize.org/master/class/lib/model.js~Model.html#instance-method-save
      curation.themeInfo = [...curation.themeInfo, theme];
      await curation.save({
        transaction: t,
      });

      await CurationCard.create(
        {
          CurationId: curationId,
          theme,
          title,
          detail,
          photo,
        },
        {
          transaction: t,
        }
      );
    });
  } catch (err) {
    if (err instanceof errorMessage) {
      return res.status(err.code).json({ message: err.message });
    } else {
      console.log(
        "-------------------------------Error occurred in curation-card/createCurationCard.js-------------------------------- \n",
        err,
        "-------------------------------Error occurred in curation-card/createCurationCard.js-------------------------------- \n"
      );
      return res.status(500).send();
    }
  }
  res.status(200).json({ message: "successfully added" });
};
