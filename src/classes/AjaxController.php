<?php

namespace postyou;


/*
 *   level = type:
 *   0: runs
 *   1: TestObj Types
 *   2: TestObjects of one Type
 *   3: Resultpage of a TestObject
 *
 */

abstract class AjaxController extends \Controller
{
    private $ajax_token;
    private $request_id;
    private $request_group;
    private $getDataCallbackStr;

    private $requestData;

    private $errorMsg;

    /**
     * @param $requestInfo
     */
    public function __construct($ajax_token)
    {

//        $GLOBALS['TL_JAVASCRIPT']['jquery'] = 'assets/jquery/core/' . reset((scandir(TL_ROOT . '/assets/jquery/core', 1))) . '/jquery.min.js';
        $GLOBALS['TL_JAVASCRIPT']['ajax'] = 'system/modules/ajax_lib/assets/js/ajax.js';
        $GLOBALS['TL_CSS']['ajax'] = '/system/modules/ajax_lib/assets/css/ajax.css';
        $this->errorMsg = array();
        $this->ajax_token=$ajax_token;
        $this->import("Database");
   }

    public function ifAjaxDoRespond(){
        if ($_SERVER['REQUEST_METHOD']=="POST" && \Environment::get('isAjaxRequest') && (\Input::findPost("AJAX_TOKEN")!==null)
            && \Input::post("AJAX_TOKEN")==$this->ajax_token) {
            $this->requestData=$this->getReqDataFromResponse($_POST);
            $this->getDataPrepareSend();
        }
    }

    protected abstract function responseData($requestData);

    protected abstract function prepareData($data);

    public function getDataPrepareSend()
    {
        $res1 = $this->responseData($this->requestData);
        if (!isset($res1)) {
            $this->addErrorMsg("Response-Data is null");
        }else {
            $res2 = $this->prepareData($res1);
            if (!isset($res2)) {
                $this->addErrorMsg("DataPreparation returned null");
            }
        }
        $res2["AJAX_TOKEN"]=$this->ajax_token;
        $res2["REQUEST_ID"]=$this->request_id;
        $res2["REQUEST_GROUP"]=$this->request_group;
        $this->sendAjaxResponse($res2);

        exit;
    }

    /**
     * Sets Request Data and sets it to the object, cuts it from the request array.
     * @param $requestData
     * @return mixed
     */
    private function getReqDataFromResponse($requestData){
        if(isset($requestData['REQUEST_ID'])){
            $this->request_id=$requestData['REQUEST_ID'];
            unset($requestData['REQUEST_ID']);
        }
        if(isset($requestData['REQUEST_GROUP'])){
            $this->request_group=$requestData['REQUEST_GROUP'];
            unset($requestData['REQUEST_GROUP']);
        }
        if(isset($requestData['AJAX_TOKEN'])){
            $this->ajax_token=$requestData['AJAX_TOKEN'];
            unset($requestData['AJAX_TOKEN']);
        }
        unset($requestData['REQUEST_TOKEN']);
        return $requestData;
    }

    private function sendAjaxResponse($responseData)
    {

        if ($responseData == null) {

            $this->addErrorMsg("PHP-Ajax Response Data is Null");
        }

        if (!empty($this->errorMsg)) {
            $responseData = $this->errorMsg;
        }

        $jsonStr = json_encode($responseData, 5);

        if ($this->isJSON($jsonStr)) {
            echo $jsonStr;
        } else {
            throw new \Exception("PHP-Ajax Response Data could not convert to valid Json");
            error_log("JSON fault:" . serialize($responseData));
            return false;
        }

        if (empty($this->errorMsg)) {
            return true;
        } else {
            return false;
        }

        echo json_encode($responseData, 5);
    }


    private function addErrorMsg($string)
    {
        if (!isset($this->errorMsg) || !is_array($this->errorMsg)) {
            $this->errorMsg = array();
        } else {
            array_push($this->errorMsg, $string);
        }
    }

    private function isJSON($string)
    {
        $decodedString = json_decode($string);
        return is_string($string) && (is_object($decodedString) || is_array($decodedString)) ? true : false;
    }

    public function getAjaxToken(){
        return $this->ajax_token;
    }


}