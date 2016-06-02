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

use Contao\Input;

abstract class AjaxController extends \Controller
{
    protected $ajax_token;
    private $request_id;
    private $request_group;

    protected $requestData=array();
    protected $requestIntoResponse;

    protected $errorMsgArr;

    /**
     * @param $requestInfo
     */
    public function __construct($ajax_token, $requestIntoResponse = array())
    {

//        $GLOBALS['TL_JAVASCRIPT']['jquery'] = 'assets/jquery/core/' .
//           reset((scandir(TL_ROOT . '/assets/jquery/core', 1))) . '/jquery.min.js';
        $GLOBALS['TL_JAVASCRIPT']['ajax'] = 'system/modules/ajax_lib/assets/js/ajax.js';
        $GLOBALS['TL_CSS']['ajax']        = '/system/modules/ajax_lib/assets/css/ajax.css';
        $this->requestIntoResponse=$requestIntoResponse;
        $this->errorMsgArr = array();
        $this->ajax_token=$ajax_token;
        $this->import("Database");
    }

    protected abstract function responseData($requestData);

    protected abstract function prepareData($data);

    public function ifAjaxDoRespond()
    {
        if ($_SERVER['REQUEST_METHOD']=="POST" &&
            \Environment::get('isAjaxRequest') &&
            (\Input::findPost("AJAX_TOKEN")!==null)
            && \Input::post("AJAX_TOKEN")==$this->ajax_token) {
            $this->getReqDataFromResponse();
            $this->getDataPrepareSend();
        }
    }

    public function getDataPrepareSend()
    {
        $res1 = $this->responseData($this->requestData);
        if (!isset($res1) && $this->errorMsgIsEmpty()) {
            $this->addErrorMsg("Response-Data is null");
        } else {
            $res2 = $this->prepareData($res1);
            if (!isset($res2) && $this->errorMsgIsEmpty()) {
                $this->addErrorMsg("DataPreparation returned null");
            }
        }
        $this->checkRequestResponseValues($res2);
        $res2["AJAX_TOKEN"]=$this->ajax_token;
        $res2["REQUEST_ID"]=$this->request_id;
        $res2["REQUEST_GROUP"]=$this->request_group;
        $this->sendAjaxResponse($res2);
        exit();
    }

    private function checkRequestResponseValues(&$res2)
    {
        if (!empty($this->requestIntoResponse)) {
            foreach ($this->requestIntoResponse as $requestValue) {
                if (array_key_exists($requestValue, $this->requestData)) {
                    $res2[$requestValue] = $this->requestData[$requestValue];
                }
            }
        }
    }


    /**
     * Sets Request Data and sets it to the object, cuts it from the request array.
     * @param $requestData
     * @return mixed
     */
    protected function getReqDataFromResponse()
    {
        foreach ($_POST as $key => $value) {
            switch ($key) {
                case "REQUEST_ID":
                    $this->request_id=\Input::post($key);
                    break;
                case "REQUEST_GROUP":
                    $this->request_group=\Input::post($key);
                    break;
                case "AJAX_TOKEN":
//                    $this->ajax_token=\Input::post($key);
//                    break;
                case "REQUEST_TOKEN":
                    break;
                default:
                    $this->requestData[$key]=\Input::post($key);
                    break;
            }

        }
    }

    private function sendAjaxResponse($responseData)
    {

        if ($responseData == null) {

            $this->addErrorMsg("PHP-Ajax Response Data is Null");
        }

        if (!empty($this->errorMsgArr)) {
            $responseData = array_merge($responseData, array('error'=>$this->errorMsgArr));
        }
        ob_clean();
        $jsonStr = json_encode($responseData, 5);

        if ($this->isJSON($jsonStr)) {
            echo $jsonStr;
            return true;
        } else {
            throw new \Exception("PHP-Ajax Response Data could not convert to valid Json");
            error_log("JSON fault:" . serialize($responseData));
            return false;
        }


        if (empty($this->errorMsgArr)) {
            return true;
        } else {
            return false;
        }
        echo json_encode($responseData, 5);
        return true;
    }


    protected function addErrorMsg($string)
    {
        if (!isset($this->errorMsgArr) || !is_array($this->errorMsgArr)) {
            $this->errorMsgArr = array();
        } else {
            array_push($this->errorMsgArr, $string);
        }
    }

    protected function hasErrorMsg()
    {
        if (!isset($this->errorMsgArr) || !is_array($this->errorMsgArr) || empty($this->errorMsgArr)) {
            return false;
        } else {
          return true;
        }
    }

    protected function addErrorArr($arr)
    {
        if (!isset($this->errorMsgArr) || !is_array($this->errorMsgArr)) {
            $this->errorMsgArr = array();
        } elseif (is_array($arr)) {
            $this->errorMsgArr=array_merge($this->errorMsgArr, $arr);
        }
    }

    protected function errorMsgIsEmpty()
    {
        return !isset($this->errorMsgArr) || !is_array($this->errorMsgArr) || empty($this->errorMsgArr);
    }

    private function isJSON($string)
    {
        $decodedString = json_decode($string);
        return is_string($string) && (is_object($decodedString) || is_array($decodedString)) ? true : false;
    }

    public function getAjaxToken(){
        return $this->ajax_token;
    }

    public function nonAjaxGet($data)
    {
        if (\Environment::get('isAjaxRequest')) {
            return false;
        }
        $res1 = $this->responseData($data);
        $res2 = $this->prepareData($res1);
        $res3=array_merge($res2, $this->errorMsgArr);
        return $res3;
    }


}